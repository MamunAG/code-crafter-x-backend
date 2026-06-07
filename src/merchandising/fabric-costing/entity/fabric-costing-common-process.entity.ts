import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from 'src/common/entities/base.entity';
import { FabricProcess } from 'src/merchandising/master-data/fabric-process/entity/fabric-process.entity';
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { FabricCosting } from './fabric-costing.entity';

@Entity('fabric_costing_common_process')
export class FabricCostingCommonProcess extends BaseEntity {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'fabric_costing_id', type: 'uuid' })
  fabricCostingId: string;

  @Column({ name: 'process_id', type: 'integer', nullable: true })
  processId?: number | null;

  @Column({ name: 'rate_unit_fabric', type: 'numeric', precision: 18, scale: 4, default: 0 })
  ratePerUnitFabric: number;

  @Column({ name: 'wastage_percentage', type: 'numeric', precision: 18, scale: 4, default: 0 })
  wastagePercentage: number;

  @ManyToOne(() => FabricCosting, (fabricCosting) => fabricCosting.commonProcesses, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'fabric_costing_id' })
  fabricCosting: FabricCosting;

  @ManyToOne(() => FabricProcess, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'process_id' })
  process?: FabricProcess | null;
}
