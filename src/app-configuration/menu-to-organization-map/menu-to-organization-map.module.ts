import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Menu } from '../menu/entity/menu.entity';
import { MenuPermission } from '../menu-permission/entity/menu-permission.entity';
import { Organization } from '../organization/entity/organization.entity';
import { MenuToOrganizationMap } from './entity/menu-to-organization-map.entity';
import { MenuToOrganizationMapController } from './menu-to-organization-map.controller';
import { MenuToOrganizationMapService } from './menu-to-organization-map.service';

@Module({
  imports: [TypeOrmModule.forFeature([MenuToOrganizationMap, MenuPermission, Menu, Organization])],
  controllers: [MenuToOrganizationMapController],
  providers: [MenuToOrganizationMapService],
  exports: [MenuToOrganizationMapService],
})
export class MenuToOrganizationMapModule {}
