import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from 'src/common/entities/base.entity';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('uom')
export class Uom extends BaseEntity {
  @ApiProperty({ description: 'Primary ID' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: 'UOM name', example: 'Kilogram' })
  @Column({ nullable: false })
  name: string;

  @ApiProperty({ description: 'UOM short name', example: 'KG' })
  @Column({ nullable: false })
  short_name: string;

  @ApiProperty({ description: 'Active status', example: 'Y' })
  @Column({ type: 'varchar', length: 10, default: 'Y', nullable: false })
  is_active: string;
}
