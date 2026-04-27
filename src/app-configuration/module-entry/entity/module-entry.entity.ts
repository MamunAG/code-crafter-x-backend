import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from 'src/common/entities/base.entity';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('module_entry')
export class ModuleEntry extends BaseEntity {
  @ApiProperty({ description: 'Primary ID' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Module display name', example: 'Merchandising' })
  @Column({ name: 'module_name', type: 'varchar', nullable: false })
  moduleName: string;

  @ApiProperty({ description: 'Unique module key', example: 'merchandising' })
  @Column({ name: 'module_key', type: 'varchar', nullable: false })
  moduleKey: string;

  @ApiProperty({ description: 'Module description', required: false, nullable: true })
  @Column({ name: 'description', type: 'text', nullable: true })
  description?: string | null;

  @ApiProperty({ description: 'Sort order', example: 1 })
  @Column({ name: 'display_order', type: 'int', default: 0, nullable: false })
  displayOrder: number;

  @ApiProperty({ description: 'Active status', example: true })
  @Column({ name: 'is_active', type: 'boolean', default: true, nullable: false })
  isActive: boolean;
}
