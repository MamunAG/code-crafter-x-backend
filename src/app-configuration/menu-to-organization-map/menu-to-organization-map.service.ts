import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';

import type AuthUser from 'src/auth/dto/auth-user';
import { Menu } from 'src/app-configuration/menu/entity/menu.entity';
import { MenuPermission } from 'src/app-configuration/menu-permission/entity/menu-permission.entity';
import { Organization } from 'src/app-configuration/organization/entity/organization.entity';
import { RolesEnum } from 'src/common/enums/role.enum';
import { UpsertMenuToOrganizationMapDto } from './dto/upsert-menu-to-organization-map.dto';
import { MenuToOrganizationMap } from './entity/menu-to-organization-map.entity';

@Injectable()
export class MenuToOrganizationMapService {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,

    @InjectRepository(MenuToOrganizationMap)
    private readonly menuToOrganizationMapRepository: Repository<MenuToOrganizationMap>,

    @InjectRepository(Menu)
    private readonly menuRepository: Repository<Menu>,

    @InjectRepository(Organization)
    private readonly organizationRepository: Repository<Organization>,
  ) {}

  async findByOrganization(currentUser: AuthUser, organizationId: string) {
    this.ensureCurrentUserIsAdmin(currentUser);
    await this.ensureOrganizationExists(organizationId);

    return this.menuToOrganizationMapRepository.find({
      where: { organizationId },
      relations: ['menu', 'organization'],
      order: {
        menu: {
          displayOrder: 'ASC',
          menuName: 'ASC',
        },
      },
    });
  }

  async replaceForOrganization(currentUser: AuthUser, dto: UpsertMenuToOrganizationMapDto) {
    this.ensureCurrentUserIsAdmin(currentUser);
    await this.ensureOrganizationExists(dto.organizationId);
    await this.ensureMenusExist(dto.menuIds);

    const uniqueMenuIds = [...new Set(dto.menuIds)];

    return this.dataSource.transaction(async (manager) => {
      const mappingRepository = manager.getRepository(MenuToOrganizationMap);
      const permissionRepository = manager.getRepository(MenuPermission);

      const existingMappings = await mappingRepository.find({
        where: { organizationId: dto.organizationId },
      });
      const nextMenuIdSet = new Set(uniqueMenuIds);
      const removedMenuIds = existingMappings
        .map((mapping) => mapping.menuId)
        .filter((menuId) => !nextMenuIdSet.has(menuId));

      if (removedMenuIds.length) {
        await permissionRepository.delete({
          organizationId: dto.organizationId,
          menuId: In(removedMenuIds),
        });
        await mappingRepository.delete({
          organizationId: dto.organizationId,
          menuId: In(removedMenuIds),
        });
      }

      for (const menuId of uniqueMenuIds) {
        const existingMapping = existingMappings.find((mapping) => mapping.menuId === menuId);

        if (existingMapping) {
          continue;
        }

        await mappingRepository.save(
          mappingRepository.create({
            organizationId: dto.organizationId,
            menuId,
            created_by_id: currentUser.userId,
          }),
        );
      }

      return this.findByOrganization(currentUser, dto.organizationId);
    });
  }

  async remove(currentUser: AuthUser, organizationId: string, menuId: string) {
    this.ensureCurrentUserIsAdmin(currentUser);
    await this.ensureOrganizationExists(organizationId);
    await this.ensureMenusExist([menuId]);

    await this.dataSource.transaction(async (manager) => {
      await manager.getRepository(MenuPermission).delete({
        organizationId,
        menuId,
      });
      await manager.getRepository(MenuToOrganizationMap).delete({
        organizationId,
        menuId,
      });
    });

    return this.findByOrganization(currentUser, organizationId);
  }

  private ensureCurrentUserIsAdmin(currentUser: AuthUser) {
    if (currentUser.role !== RolesEnum.admin) {
      throw new ForbiddenException('Only an admin can manage organization menu mappings.');
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
}
