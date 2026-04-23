import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from 'src/common/entities/base.entity';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('currency')
export class Currency extends BaseEntity {
  @ApiProperty({ description: 'Primary ID' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: 'Currency name', example: 'Bangladeshi Taka' })
  @Column({ name: 'currencyname', nullable: false })
  currencyName: string;

  @ApiProperty({ description: 'Currency code', example: 'BDT' })
  @Column({ name: 'currencycode', nullable: false })
  currencyCode: string;

  @ApiProperty({ description: 'Exchange rate', example: 1.0 })
  @Column({ name: 'rate', type: 'double precision', nullable: false })
  rate: number;

  @ApiProperty({ description: 'Currency symbol', example: 'BDT' })
  @Column({ name: 'symbol', nullable: false })
  symbol: string;

  @ApiProperty({ description: 'Default currency flag', example: true })
  @Column({ name: 'is_default', type: 'boolean', default: false, nullable: false })
  isDefault: boolean;

  @ApiProperty({ description: 'Active status', example: true })
  @Column({ name: 'is_active', type: 'boolean', default: true, nullable: false })
  isActive: boolean;
}
