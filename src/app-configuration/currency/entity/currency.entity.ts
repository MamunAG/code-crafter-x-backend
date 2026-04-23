import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from 'src/common/entities/base.entity';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('currency')
export class Currency extends BaseEntity {
  @ApiProperty({ description: 'Primary ID' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: 'Currency name', example: 'Bangladeshi Taka' })
  @Column({ nullable: false })
  currencyname: string;

  @ApiProperty({ description: 'Currency code', example: 'BDT' })
  @Column({ nullable: false })
  currencycode: string;

  @ApiProperty({ description: 'Exchange rate', example: 1.0 })
  @Column({ type: 'double precision', nullable: false })
  rate: number;

  @ApiProperty({ description: 'Currency symbol', example: 'BDT' })
  @Column({ nullable: false })
  symbol: string;

  @ApiProperty({ description: 'Default currency flag', example: true })
  @Column({ type: 'boolean', default: false, nullable: false })
  is_default: boolean;

  @ApiProperty({ description: 'Active status', example: true })
  @Column({ type: 'boolean', default: true, nullable: false })
  is_active: boolean;
}
