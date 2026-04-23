import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from 'src/common/entities/base.entity';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('uom')
export class Uom extends BaseEntity {
  @ApiProperty({ description: 'Primary ID' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: 'UOM name', example: 'Kilogram' })
  @Column({ name: 'name', nullable: false })
  name: string;

  @ApiProperty({ description: 'UOM short name', example: 'KG' })
  @Column({ name: 'short_name', nullable: false })
  shortName: string;

  @ApiProperty({ description: 'Active status', example: 'Y' })
  @Column({ name: 'is_active', type: 'varchar', length: 10, default: 'Y', nullable: false })
  isActive: string;
}
