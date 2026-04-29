import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from 'src/common/entities/base.entity';
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { ModuleEntry } from 'src/app-configuration/module-entry/entity/module-entry.entity';

@Entity('menu')
export class Menu extends BaseEntity {
  @ApiProperty({ description: 'Primary ID' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Menu display name', example: 'Dashboard' })
  @Column({ name: 'menu_name', type: 'varchar', nullable: false })
  menuName: string;

  @ApiProperty({ description: 'Menu navigation path', example: '/dashboard', required: false, nullable: true })
  @Column({ name: 'menu_path', type: 'varchar', nullable: true })
  menuPath?: string | null;

  @ApiProperty({ description: 'Module ID', example: '550e8400-e29b-41d4-a716-446655440000' })
  @Column({ name: 'module_id', type: 'uuid', nullable: false })
  moduleId: string;

  @ManyToOne(() => ModuleEntry, { nullable: false })
  @JoinColumn({ name: 'module_id' })
  moduleEntry: ModuleEntry;

  @ApiProperty({ description: 'Menu description', required: false, nullable: true })
  @Column({ name: 'description', type: 'text', nullable: true })
  description?: string | null;

  @ApiProperty({ description: 'Sort order', example: 1 })
  @Column({ name: 'display_order', type: 'int', default: 0, nullable: false })
  displayOrder: number;

  @ApiProperty({ description: 'Active status', example: true })
  @Column({ name: 'is_active', type: 'boolean', default: true, nullable: false })
  isActive: boolean;
}
