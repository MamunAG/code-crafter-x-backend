import { ApiProperty } from '@nestjs/swagger';
import { Menu } from 'src/app-configuration/menu/entity/menu.entity';
import { Organization } from 'src/app-configuration/organization/entity/organization.entity';
import { BaseEntity } from 'src/common/entities/base.entity';
import { Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';

@Entity('menu_to_organization_map')
export class MenuToOrganizationMap extends BaseEntity {
  @ApiProperty({ description: 'Menu ID' })
  @PrimaryColumn({ name: 'menu_id', type: 'uuid' })
  menuId: string;

  @ApiProperty({ description: 'Organization ID' })
  @PrimaryColumn({ name: 'organization_id', type: 'uuid' })
  organizationId: string;

  @ApiProperty({ description: 'Menu', type: () => Menu })
  @ManyToOne(() => Menu, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'menu_id' })
  menu: Menu;

  @ApiProperty({ description: 'Organization', type: () => Organization })
  @ManyToOne(() => Organization, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;
}
