import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('currency_exchange_rate')
@Index(['currency_code', 'currency_date'], { unique: true })
export class CurrencyExchangeRate {
  @ApiProperty({ description: 'Primary ID' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: 'Currency Date', example: '2025-03-14T12:00:00.000Z', })
  @Column({ nullable: false, type: 'timestamp' })
  currency_date: Date;

  @ApiProperty({ description: 'Target Currency', example: 'EUR' })
  @Column({ nullable: false })
  currency_code: string;

  @ApiProperty({ description: 'Currency Rate', example: 1.79 })
  @Column({ type: 'decimal', precision: 10, scale: 4, nullable: false })
  rate_in_bdt: number;
}
