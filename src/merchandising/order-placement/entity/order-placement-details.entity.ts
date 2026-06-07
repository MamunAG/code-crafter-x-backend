import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BaseEntity } from 'src/common/entities/base.entity';
import { JobDetails } from 'src/merchandising/job/entity/job-details.entity';
import { Job } from 'src/merchandising/job/entity/job.entity';
import { PurchaseOrder } from 'src/merchandising/job/entity/purchase-order.entity';
import { Color } from 'src/merchandising/master-data/color/entity/color.entity';
import { Size } from 'src/merchandising/master-data/size/entity/size.entity';
import { Style } from 'src/merchandising/style/entity/style.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { OrderPlacement } from './order-placement.entity';

@Entity('order_placement_details')
export class OrderPlacementDetails extends BaseEntity {
  @ApiProperty({ description: 'Primary ID' })
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id: string;

  @ApiProperty({ description: 'Order placement ID', example: '8bf7d37e-4a62-47b1-b1e5-ded54c3cfb1f' })
  @Column({ name: 'order_placement_id', type: 'uuid', nullable: false })
  orderPlacementId: string;

  @ApiPropertyOptional({ description: 'Source job detail ID', example: '8bf7d37e-4a62-47b1-b1e5-ded54c3cfb1f' })
  @Column({ name: 'job_detail_id', type: 'uuid', nullable: true })
  jobDetailId?: string | null;

  @Column({ name: 'job_id', type: 'uuid', nullable: false })
  jobId: string;

  @Column({ name: 'po_id', type: 'uuid', nullable: false })
  poId: string;

  @Column({ name: 'style_id', type: 'uuid', nullable: false })
  styleId: string;

  @Column({ name: 'size_id', type: 'integer', nullable: false })
  sizeId: number;

  @Column({ name: 'color_id', type: 'integer', nullable: false })
  colorId: number;

  @Column({ name: 'quantity', type: 'numeric', precision: 18, scale: 4, default: 0 })
  quantity: number;

  @Column({ name: 'fob', type: 'numeric', precision: 18, scale: 4, default: 0 })
  fob: number;

  @Column({ name: 'cm_per_dzn', type: 'numeric', precision: 18, scale: 4, default: 0 })
  cm: number;

  @Column({ name: 'delivery_date', type: 'date', nullable: true })
  deliveryDate?: Date | null;

  @Column({ name: 'cutting_limit_percentage', type: 'numeric', precision: 18, scale: 4, default: 0 })
  cuttingLimitPercentage: number;

  @Column({ name: 'remarks', type: 'text', nullable: true })
  remarks?: string | null;

  @Column({ name: 'factory_cm_per_dzn', type: 'numeric', precision: 18, scale: 4, default: 0 })
  factoryCmPerDzn: number;

  @Column({ name: 'factory_fob', type: 'numeric', precision: 18, scale: 4, default: 0 })
  factoryFob: number;

  @Column({ name: 'factory_shipment_date', type: 'date', nullable: true })
  factoryShipmentDate?: Date | null;

  @Column({ name: 'total_factory_cm', type: 'numeric', precision: 18, scale: 4, default: 0 })
  totalFactoryCm: number;

  @Column({ name: 'total_factory_fob', type: 'numeric', precision: 18, scale: 4, default: 0 })
  totalFactoryFob: number;

  @ManyToOne(() => OrderPlacement, (orderPlacement) => orderPlacement.orderPlacementDetails, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_placement_id' })
  orderPlacement: OrderPlacement;

  @ManyToOne(() => JobDetails, { nullable: true })
  @JoinColumn({ name: 'job_detail_id' })
  jobDetail?: JobDetails | null;

  @ManyToOne(() => Job, { nullable: false })
  @JoinColumn({ name: 'job_id' })
  job: Job;

  @ManyToOne(() => PurchaseOrder, { nullable: false })
  @JoinColumn({ name: 'po_id' })
  purchaseOrder: PurchaseOrder;

  @ManyToOne(() => Style, { nullable: false })
  @JoinColumn({ name: 'style_id' })
  style: Style;

  @ManyToOne(() => Size, { nullable: false })
  @JoinColumn({ name: 'size_id' })
  size: Size;

  @ManyToOne(() => Color, { nullable: false })
  @JoinColumn({ name: 'color_id' })
  color: Color;
}
