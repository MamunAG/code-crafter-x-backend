import { ApiProperty } from '@nestjs/swagger';
import { Currency } from 'src/app-configuration/currency/entity/currency.entity';
import { Supplier } from 'src/app-configuration/supplier/entity/supplier.entity';
import { BaseEntity } from 'src/common/entities/base.entity';
import { Buyer } from 'src/merchandising/buyer/entity/buyer.entity';
import { Job } from 'src/merchandising/job/entity/job.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { OrderPlacementDetails } from './order-placement-details.entity';

@Entity('order_placement')
export class OrderPlacement extends BaseEntity {
  @ApiProperty({ description: 'Primary ID' })
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id: string;

  @ApiProperty({ description: 'Buyer ID', example: '8bf7d37e-4a62-47b1-b1e5-ded54c3cfb1f' })
  @Column({ name: 'buyer_id', type: 'uuid', nullable: false })
  buyerId: string;

  @ApiProperty({ description: 'Job ID', example: '8bf7d37e-4a62-47b1-b1e5-ded54c3cfb1f' })
  @Column({ name: 'job_id', type: 'uuid', nullable: false })
  jobId: string;

  @ApiProperty({ description: 'Currency ID', example: 1 })
  @Column({ name: 'currency_id', type: 'integer', nullable: false })
  currencyId: number;

  @ApiProperty({ description: 'Placement date', example: '2026-05-21' })
  @Column({ name: 'placement_date', type: 'date', nullable: false })
  placementDate: Date;

  @ApiProperty({ description: 'Exchange rate BDT', example: 120.5 })
  @Column({ name: 'exchange_rate_bdt', type: 'numeric', precision: 18, scale: 4, default: 1, nullable: false })
  exchangeRateBDT: number;

  @ApiProperty({ description: 'Factory supplier ID', example: '8bf7d37e-4a62-47b1-b1e5-ded54c3cfb1f' })
  @Column({ name: 'factory_id', type: 'uuid', nullable: false })
  factoryId: string;

  @ApiProperty({ description: 'Placed status', example: true })
  @Column({ name: 'is_placed', type: 'boolean', default: false, nullable: false })
  isPlaced: boolean;

  @ApiProperty({ description: 'Buyer object', type: () => Buyer })
  @ManyToOne(() => Buyer, { nullable: false })
  @JoinColumn({ name: 'buyer_id' })
  buyer: Buyer;

  @ApiProperty({ description: 'Job object', type: () => Job })
  @ManyToOne(() => Job, { nullable: false })
  @JoinColumn({ name: 'job_id' })
  job: Job;

  @ApiProperty({ description: 'Currency object', type: () => Currency })
  @ManyToOne(() => Currency, { nullable: false })
  @JoinColumn({ name: 'currency_id' })
  currency: Currency;

  @ApiProperty({ description: 'Factory supplier object', type: () => Supplier })
  @ManyToOne(() => Supplier, { nullable: false })
  @JoinColumn({ name: 'factory_id' })
  factory: Supplier;

  @ApiProperty({ description: 'Order placement details', type: () => [OrderPlacementDetails], required: false })
  @OneToMany(() => OrderPlacementDetails, (details) => details.orderPlacement)
  orderPlacementDetails?: OrderPlacementDetails[];
}
