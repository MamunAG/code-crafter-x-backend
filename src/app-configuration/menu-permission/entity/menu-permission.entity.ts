import { ApiProperty } from '@nestjs/swagger';
import { Menu } from 'src/app-configuration/menu/entity/menu.entity';
import { Organization } from 'src/app-configuration/organization/entity/organization.entity';
import { BaseEntity } from 'src/common/entities/base.entity';
import { User } from 'src/users/entities/user.entity';
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

@Entity('menu_permission')
export class MenuPermission extends BaseEntity {
  @ApiProperty({ description: 'Primary ID' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Organization ID' })
  @Column({ name: 'organization_id', type: 'uuid' })
  organizationId: string;

  @ApiProperty({ description: 'User ID receiving the permission' })
  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ApiProperty({ description: 'Menu ID' })
  @Column({ name: 'menu_id', type: 'uuid' })
  menuId: string;

  @ApiProperty({ description: 'Can view this menu' })
  @Column({ name: 'can_view', type: 'boolean', default: false })
  canView: boolean;

  @ApiProperty({ description: 'Can create from this menu' })
  @Column({ name: 'can_create', type: 'boolean', default: false })
  canCreate: boolean;

  @ApiProperty({ description: 'Can update from this menu' })
  @Column({ name: 'can_update', type: 'boolean', default: false })
  canUpdate: boolean;

  @ApiProperty({ description: 'Can delete from this menu' })
  @Column({ name: 'can_delete', type: 'boolean', default: false })
  canDelete: boolean;

  @ApiProperty({ description: 'Organization', type: () => Organization })
  @ManyToOne(() => Organization, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @ApiProperty({ description: 'User', type: () => User })
  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ApiProperty({ description: 'Menu', type: () => Menu })
  @ManyToOne(() => Menu, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'menu_id' })
  menu: Menu;
}
