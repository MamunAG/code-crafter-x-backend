import { ApiProperty } from '@nestjs/swagger';
import { Organization } from 'src/app-configuration/organization/entity/organization.entity';
import { BaseEntity } from 'src/common/entities/base.entity';
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

@Entity('menu')
export class Menu extends BaseEntity {
  @ApiProperty({ description: 'Primary ID' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Organization ID that owns this menu entry' })
  @Column({ name: 'organization_id', type: 'uuid' })
  organizationId: string;

  @ApiProperty({ description: 'Menu display name', example: 'Dashboard' })
  @Column({ name: 'menu_name', type: 'varchar', nullable: false })
  menuName: string;

  @ApiProperty({ description: 'Menu navigation path', example: '/dashboard' })
  @Column({ name: 'menu_path', type: 'varchar', nullable: false })
  menuPath: string;

  @ApiProperty({ description: 'Menu description', required: false, nullable: true })
  @Column({ name: 'description', type: 'text', nullable: true })
  description?: string | null;

  @ApiProperty({ description: 'Sort order', example: 1 })
  @Column({ name: 'display_order', type: 'int', default: 0, nullable: false })
  displayOrder: number;

  @ApiProperty({ description: 'Active status', example: true })
  @Column({ name: 'is_active', type: 'boolean', default: true, nullable: false })
  isActive: boolean;

  @ApiProperty({ description: 'Organization', type: () => Organization })
  @ManyToOne(() => Organization, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;
}
