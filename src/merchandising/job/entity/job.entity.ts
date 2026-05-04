import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from 'src/common/entities/base.entity';
import { Buyer } from 'src/merchandising/buyer/entity/buyer.entity';
import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { Factory } from 'src/app-configuration/factory/entity/factory.entity';
import { JobDetails } from './job-details.entity';

export enum OrderType {
    Retail = 'Retail',
    Promotional = 'Promotional',
}

@Entity('job')
export class Job extends BaseEntity {
    @ApiProperty({ description: 'Primary ID' })
    @PrimaryGeneratedColumn('uuid', { name: 'id' })
    id: string;

    @Column({ name: 'factory_id', type: 'uuid', nullable: false })
    factoryId: string;

    @Column({ name: 'buyer_id', type: 'uuid', nullable: false })
    buyerId: string;

    @Column({ name: 'merchandiser_id', type: 'integer', nullable: true, default: 0 })
    merchandiserId?: number;

    @Column({
        name: 'ordertype',
        type: 'enum',
        enum: OrderType,
        nullable: true,
    })
    ordertype?: OrderType;

    @Column({ name: 'total_po_qty', type: 'numeric', precision: 18, scale: 4, default: 0 })
    totalPoQty: number;

    @Column({ name: 'po_receive_date', type: 'date', nullable: true })
    poReceiveDate?: Date;

    @Column({ name: 'is_active', type: 'boolean', default: true })
    isActive: boolean;

    /* Relations */

    @ManyToOne(() => Factory, { nullable: false })
    @JoinColumn({ name: 'factory_id' })
    factory: Factory;

    @ManyToOne(() => Buyer, { nullable: false })
    @JoinColumn({ name: 'buyer_id' })
    buyer: Buyer;

    @OneToMany(() => JobDetails, (details) => details.job)
    jobDetails?: JobDetails[];
}