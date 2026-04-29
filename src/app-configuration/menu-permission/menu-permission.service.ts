import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { Brackets, DataSource, In, Repository } from 'typeorm';

import type AuthUser from 'src/auth/dto/auth-user';
import { RolesEnum } from 'src/common/enums/role.enum';
import type { MenuAccessAction } from 'src/common/decorators/menu-access.decorator';
import { Menu } from 'src/app-configuration/menu/entity/menu.entity';
import { MenuToOrganizationMap } from 'src/app-configuration/menu-to-organization-map/entity/menu-to-organization-map.entity';
import { Organization } from 'src/app-configuration/organization/entity/organization.entity';
import { UserToOranizationMap } from 'src/app-configuration/user-to-oranization-map/entity/user-to-oranization-map.entity';
import { User } from 'src/users/entities/user.entity';
import { CurrentMenuPermissionDto } from './dto/current-menu-permission.dto';
import { FilterMenuPermissionDto } from './dto/filter-menu-permission.dto';
import { UpsertMenuPermissionDto } from './dto/upsert-menu-permission.dto';
import { MenuPermission } from './entity/menu-permission.entity';

@Injectable()
export class MenuPermissionService {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,

    @InjectRepository(MenuPermission)
    private readonly menuPermissionRepository: Repository<MenuPermission>,

    @InjectRepository(Menu)
    private readonly menuRepository: Repository<Menu>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(Organization)
    private readonly organizationRepository: Repository<Organization>,

    @InjectRepository(UserToOranizationMap)
    private readonly userToOrganizationMapRepository: Repository<UserToOranizationMap>,

    @InjectRepository(MenuToOrganizationMap)
    private readonly menuToOrganizationMapRepository: Repository<MenuToOrganizationMap>,
  ) {}

  async hasCurrentMenuAccess(
    currentUser: AuthUser,
    filters: CurrentMenuPermissionDto & { action: MenuAccessAction },
  ) {
    const permission = await this.findCurrent(currentUser, filters);
    return Boolean(permission[filters.action]);
  }

  async findCurrent(currentUser: AuthUser, filters: CurrentMenuPermissionDto) {
    const isGlobalAdmin = await this.isGlobalAdminUser(currentUser);

    if (!filters.organizationId && !isGlobalAdmin) {
      throw new BadRequestException('Select an organization before checking menu permissions.');
    }

    const menu = await this.findMenuForPermissionCheck(filters, isGlobalAdmin);
    const organizationId = filters.organizationId ?? '';

    if (!menu) {
      return this.buildEmptyPermission(organizationId, currentUser.userId);
    }

    const isPrivilegedUser = isGlobalAdmin || await this.isPrivilegedForOrganization(
      currentUser,
      filters.organizationId,
    );

    if (isPrivilegedUser) {
      return {
        organizationId,
        userId: currentUser.userId,
        menuId: menu.id,
        canView: true,
        canCreate: true,
        canUpdate: true,
        canDelete: true,
        menu,
      };
    }

    const permission = await this.menuPermissionRepository.findOne({
      where: {
        organizationId,
        userId: currentUser.userId,
        menuId: menu.id,
      },
      relations: {
        menu: true,
      },
    });

    if (!permission) {
      return this.buildEmptyPermission(organizationId, currentUser.userId, menu);
    }

    return permission;
  }

  async findAll(currentUser: AuthUser, filters: FilterMenuPermissionDto) {
    await this.ensureCurrentUserCanManageOrganization(currentUser, filters.organizationId);

    const queryBuilder = this.menuPermissionRepository
      .createQueryBuilder('menu_permission')
      .leftJoinAndSelect('menu_permission.organization', 'organization')
      .leftJoinAndSelect('menu_permission.menu', 'menu')
      .leftJoinAndSelect('menu_permission.user', 'user')
      .where('menu_permission.deleted_at IS NULL')
      .andWhere('menu.deleted_at IS NULL')
      .orderBy('menu.displayOrder', 'ASC')
      .addOrderBy('menu.menuName', 'ASC');

    if (filters.userId) {
      queryBuilder.andWhere('menu_permission.user_id = :userId', { userId: filters.userId });
    }

    if (filters.organizationId) {
      queryBuilder.andWhere('menu_permission.organization_id = :organizationId', {
        organizationId: filters.organizationId,
      });
    }

    return queryBuilder.getMany();
  }

  async upsert(currentUser: AuthUser, dto: UpsertMenuPermissionDto) {
    await this.ensureCurrentUserCanManageOrganization(currentUser, dto.organizationId);

    if (currentUser.userId === dto.userId) {
      throw new BadRequestException('You cannot change your own menu permissions.');
    }

    await this.ensureOrganizationExists(dto.organizationId);
    await this.ensureUserExists(dto.userId);
    await this.ensureUserBelongsToOrganization(dto.userId, dto.organizationId);
    await this.ensureMenusExist(dto.permissions.map((permission) => permission.menuId));
    await this.ensureMenusMappedToOrganization(
      dto.organizationId,
      dto.permissions.map((permission) => permission.menuId),
    );

    return this.dataSource.transaction(async (manager) => {
      const permissionRepository = manager.getRepository(MenuPermission);

      for (const permission of dto.permissions) {
        const existingPermission = await permissionRepository.findOne({
          where: {
            organizationId: dto.organizationId,
            userId: dto.userId,
            menuId: permission.menuId,
          },
        });

        if (existingPermission) {
          existingPermission.canView = permission.canView;
          existingPermission.canCreate = permission.canCreate;
          existingPermission.canUpdate = permission.canUpdate;
          existingPermission.canDelete = permission.canDelete;
          existingPermission.updated_by_id = currentUser.userId;
          await permissionRepository.save(existingPermission);
          continue;
        }

        await permissionRepository.save(
          permissionRepository.create({
            userId: dto.userId,
            organizationId: dto.organizationId,
            menuId: permission.menuId,
            canView: permission.canView,
            canCreate: permission.canCreate,
            canUpdate: permission.canUpdate,
            canDelete: permission.canDelete,
            created_by_id: currentUser.userId,
          }),
        );
      }

      return this.findAll(currentUser, {
        userId: dto.userId,
        organizationId: dto.organizationId,
      });
    });
  }

  private async ensureCurrentUserCanManageOrganization(currentUser: AuthUser, organizationId?: string) {
    if (await this.isPrivilegedForOrganization(currentUser, organizationId)) {
      return;
    }

    if (!organizationId) {
      throw new ForbiddenException('Select an organization to manage menu permissions.');
    }

    throw new ForbiddenException('Only an organization admin can manage menu permissions.');
  }

  private async isPrivilegedForOrganization(currentUser: AuthUser, organizationId?: string) {
    if (await this.isGlobalAdminUser(currentUser)) {
      return true;
    }

    if (!organizationId) {
      return false;
    }

    const adminMapping = await this.userToOrganizationMapRepository.findOne({
      where: {
        userId: currentUser.userId,
        organizationId,
        role: RolesEnum.admin,
      },
      select: {
        userId: true,
        organizationId: true,
      },
    });

    return Boolean(adminMapping);
  }

  private async isGlobalAdminUser(currentUser: AuthUser) {
    if (currentUser.role === RolesEnum.admin) {
      return true;
    }

    const user = await this.userRepository.findOne({
      where: { id: currentUser.userId },
      select: {
        id: true,
        role: true,
      },
    });

    return user?.role === RolesEnum.admin;
  }

  private async findMenuForPermissionCheck(filters: CurrentMenuPermissionDto, bypassOrganizationMap = false) {
    const queryBuilder = this.menuRepository
      .createQueryBuilder('menu')
      .where('menu.deleted_at IS NULL')
      .andWhere('menu.isActive = true');

    if (filters.menuId) {
      queryBuilder.andWhere('menu.id = :menuId', { menuId: filters.menuId });
    } else if (filters.menuPath?.trim() || filters.menuName?.trim()) {
      queryBuilder.andWhere(new Brackets((menuMatch) => {
        if (filters.menuPath?.trim()) {
          menuMatch.where('LOWER(TRIM(menu.menuPath)) = :menuPath', {
            menuPath: this.normalizeMenuPath(filters.menuPath),
          });
        }

        if (filters.menuName?.trim()) {
          const method = filters.menuPath?.trim() ? 'orWhere' : 'where';
          menuMatch[method]('LOWER(TRIM(menu.menuName)) = :menuName', {
            menuName: filters.menuName.trim().toLowerCase(),
          });
        }
      }));
    } else {
      throw new BadRequestException('Select a menu before checking permissions.');
    }

    if (!bypassOrganizationMap) {
      queryBuilder.andWhere((subQuery) => {
        const mappedMenuQuery = subQuery
          .subQuery()
          .select('1')
          .from(MenuToOrganizationMap, 'menu_map')
          .where('menu_map.menu_id = menu.id')
          .andWhere('menu_map.organization_id = :organizationId')
          .getQuery();

        return `EXISTS ${mappedMenuQuery}`;
      }, {
        organizationId: filters.organizationId,
      });
    }

    return queryBuilder.orderBy('menu.displayOrder', 'ASC').getOne();
  }

  private buildEmptyPermission(organizationId: string, userId: string, menu?: Menu) {
    return {
      organizationId,
      userId,
      menuId: menu?.id ?? '',
      canView: false,
      canCreate: false,
      canUpdate: false,
      canDelete: false,
      menu,
    };
  }

  private normalizeMenuPath(menuPath: string) {
    const trimmed = menuPath.trim();
    return (trimmed.startsWith('/') ? trimmed : `/${trimmed}`).toLowerCase();
  }
  private async ensureUserExists(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }
  }

  private async ensureOrganizationExists(organizationId: string) {
    const organization = await this.organizationRepository.findOne({
      where: { id: organizationId },
    });

    if (!organization) {
      throw new BadRequestException('Organization not found');
    }
  }

  private async ensureUserBelongsToOrganization(userId: string, organizationId: string) {
    const mapping = await this.userToOrganizationMapRepository.findOne({
      where: {
        userId,
        organizationId,
      },
    });

    if (!mapping) {
      throw new BadRequestException('User does not belong to the selected organization.');
    }
  }

  private async ensureMenusExist(menuIds: string[]) {
    const uniqueMenuIds = [...new Set(menuIds)];

    if (!uniqueMenuIds.length) {
      return;
    }

    const menus = await this.menuRepository.find({
      where: {
        id: In(uniqueMenuIds),
      },
    });

    if (menus.length !== uniqueMenuIds.length) {
      throw new BadRequestException('One or more menu entries do not exist.');
    }
  }

  private async ensureMenusMappedToOrganization(organizationId: string, menuIds: string[]) {
    const uniqueMenuIds = [...new Set(menuIds)];

    if (!uniqueMenuIds.length) {
      return;
    }

    const mappedMenus = await this.menuToOrganizationMapRepository.find({
      where: {
        organizationId,
        menuId: In(uniqueMenuIds),
      },
      select: {
        menuId: true,
        organizationId: true,
      },
    });
    const mappedMenuIds = new Set(mappedMenus.map((mapping) => mapping.menuId));
    const unmappedMenuIds = uniqueMenuIds.filter((menuId) => !mappedMenuIds.has(menuId));

    if (unmappedMenuIds.length) {
      throw new BadRequestException('One or more menu entries are not mapped to this organization.');
    }
  }
}
