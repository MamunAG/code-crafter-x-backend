import { BaseEntity } from 'src/common/entities/base.entity';
import {
    Column,
    Entity,
    PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('purchase_order')
export class PurchaseOrder extends BaseEntity {
    @PrimaryGeneratedColumn('uuid', { name: 'id' })
    id: string;

    @Column({ name: 'pono', type: 'varchar', length: 50, unique: true })
    pono: string;
}