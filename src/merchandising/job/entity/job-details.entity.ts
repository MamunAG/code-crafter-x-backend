import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from 'src/common/entities/base.entity';
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
import { Job } from './job.entity';
import { PurchaseOrder } from './purchase-order.entity';

@Entity('job_details')
export class JobDetails extends BaseEntity {
    @ApiProperty({ description: 'Primary ID' })
    @PrimaryGeneratedColumn('uuid', { name: 'id' })
    id: string;

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
    deliveryDate?: Date;

    @Column({ name: 'cutting_limit_percentage', type: 'numeric', precision: 18, scale: 4, default: 0 })
    cuttingLimitPercentage: number;

    @Column({ name: 'remarks', type: 'text', nullable: true })
    remarks?: string;

    /* Relations */

    @ManyToOne(() => Job, (job) => job.jobDetails, { nullable: false, onDelete: 'CASCADE' })
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
