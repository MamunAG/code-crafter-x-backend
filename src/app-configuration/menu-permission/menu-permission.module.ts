import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Menu } from '../menu/entity/menu.entity';
import { MenuToOrganizationMap } from '../menu-to-organization-map/entity/menu-to-organization-map.entity';
import { Organization } from '../organization/entity/organization.entity';
import { UserToOranizationMap } from '../user-to-oranization-map/entity/user-to-oranization-map.entity';
import { User } from 'src/users/entities/user.entity';
import { MenuPermission } from './entity/menu-permission.entity';
import { MenuPermissionController } from './menu-permission.controller';
import { MenuPermissionService } from './menu-permission.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MenuPermission,
      Menu,
      User,
      Organization,
      UserToOranizationMap,
      MenuToOrganizationMap,
    ]),
  ],
  controllers: [MenuPermissionController],
  providers: [MenuPermissionService],
  exports: [MenuPermissionService],
})
export class MenuPermissionModule {}
