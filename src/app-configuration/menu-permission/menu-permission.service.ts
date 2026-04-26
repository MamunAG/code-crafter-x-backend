import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';

import { Menu } from 'src/app-configuration/menu/entity/menu.entity';
import { Organization } from 'src/app-configuration/organization/entity/organization.entity';
import { UserToOranizationMap } from 'src/app-configuration/user-to-oranization-map/entity/user-to-oranization-map.entity';
import { RolesEnum } from 'src/common/enums/role.enum';
import { User } from 'src/users/entities/user.entity';
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

    @InjectRepository(Organization)
    private readonly organizationRepository: Repository<Organization>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(UserToOranizationMap)
    private readonly mappingRepository: Repository<UserToOranizationMap>,
  ) {}

  async findAll(currentUserId: string, filters: FilterMenuPermissionDto) {
    await this.ensureOrganizationExists(filters.organizationId);
    await this.ensureOrganizationAdmin(currentUserId, filters.organizationId);

    const queryBuilder = this.menuPermissionRepository
      .createQueryBuilder('menu_permission')
      .leftJoinAndSelect('menu_permission.menu', 'menu')
      .leftJoinAndSelect('menu_permission.user', 'user')
      .where('menu_permission.organization_id = :organizationId', {
        organizationId: filters.organizationId,
      })
      .andWhere('menu_permission.deleted_at IS NULL')
      .orderBy('menu.displayOrder', 'ASC')
      .addOrderBy('menu.menuName', 'ASC');

    if (filters.userId) {
      queryBuilder.andWhere('menu_permission.user_id = :userId', { userId: filters.userId });
    }

    return queryBuilder.getMany();
  }

  async upsert(currentUserId: string, dto: UpsertMenuPermissionDto) {
    if (currentUserId === dto.userId) {
      throw new BadRequestException('You cannot change your own menu permissions.');
    }

    await this.ensureOrganizationExists(dto.organizationId);
    await this.ensureOrganizationAdmin(currentUserId, dto.organizationId);
    await this.ensureOrganizationMember(dto.userId, dto.organizationId);
    await this.ensureUserExists(dto.userId);
    await this.ensureMenusBelongToOrganization(
      dto.permissions.map((permission) => permission.menuId),
      dto.organizationId,
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
          existingPermission.updated_by_id = currentUserId;
          await permissionRepository.save(existingPermission);
          continue;
        }

        await permissionRepository.save(
          permissionRepository.create({
            organizationId: dto.organizationId,
            userId: dto.userId,
            menuId: permission.menuId,
            canView: permission.canView,
            canCreate: permission.canCreate,
            canUpdate: permission.canUpdate,
            canDelete: permission.canDelete,
            created_by_id: currentUserId,
          }),
        );
      }

      return this.findAll(currentUserId, {
        organizationId: dto.organizationId,
        userId: dto.userId,
      });
    });
  }

  private async ensureOrganizationExists(organizationId: string) {
    const organization = await this.organizationRepository.findOne({
      where: { id: organizationId },
    });

    if (!organization) {
      throw new BadRequestException('Organization not found');
    }
  }

  private async ensureUserExists(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }
  }

  private async ensureOrganizationAdmin(userId: string, organizationId: string) {
    const adminMapping = await this.mappingRepository.findOne({
      where: {
        userId,
        organizationId,
        role: RolesEnum.admin,
      },
    });

    if (!adminMapping) {
      throw new ForbiddenException('Only an organization admin can manage menu permissions.');
    }
  }

  private async ensureOrganizationMember(userId: string, organizationId: string) {
    const mapping = await this.mappingRepository.findOne({
      where: {
        userId,
        organizationId,
      },
    });

    if (!mapping) {
      throw new BadRequestException('The selected user does not have access to this organization.');
    }
  }

  private async ensureMenusBelongToOrganization(menuIds: string[], organizationId: string) {
    const uniqueMenuIds = [...new Set(menuIds)];

    if (!uniqueMenuIds.length) {
      return;
    }

    const menus = await this.menuRepository.find({
      where: {
        id: In(uniqueMenuIds),
        organizationId,
      },
    });

    if (menus.length !== uniqueMenuIds.length) {
      throw new BadRequestException('One or more menu entries do not belong to this organization.');
    }
  }
}
