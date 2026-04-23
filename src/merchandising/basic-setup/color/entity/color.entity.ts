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
  @Column({ nullable: false })
  color_name: string;

  @ApiProperty({ description: 'Color display name', example: 'Ocean Blue' })
  @Column({ nullable: true })
  color_display_name: string;

  @ApiProperty({ description: 'Color description', example: 'Deep blue shade used for denim.' })
  @Column({ type: 'text', nullable: true })
  color_description: string;
}
