import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from 'src/common/entities/base.entity';
import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('color')
export class Color extends BaseEntity {
  @ApiProperty({ description: 'Primary ID' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: 'Color name', example: 'Blue' })
  @Column({ name: 'color_name', nullable: false })
  colorName: string;

  @ApiProperty({ description: 'Color display name', example: 'Ocean Blue' })
  @Column({ name: 'color_display_name', nullable: true })
  colorDisplayName: string;

  @ApiProperty({ description: 'Color description', example: 'Deep blue shade used for denim.' })
  @Column({ name: 'color_description', type: 'text', nullable: true })
  colorDescription: string;

  @ApiProperty({ description: 'Active status', example: true })
  @Column({ name: 'is_active', type: 'boolean', default: true, nullable: false })
  isActive: boolean;
}
