import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from 'src/common/entities/base.entity';
import { FabricProcess } from 'src/merchandising/master-data/fabric-process/entity/fabric-process.entity';
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { FabricCostingYarn } from './fabric-costing-yarn.entity';

@Entity('fabric_costing_yarn_process')
export class FabricCostingYarnProcess extends BaseEntity {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'fabric_costing_yarn_id', type: 'uuid' })
  fabricCostingYarnId: string;

  @Column({ name: 'process_id', type: 'integer', nullable: true })
  processId?: number | null;

  @Column({ name: 'rate_unit_fabric', type: 'numeric', precision: 18, scale: 4, default: 0 })
  rateUnitFabric: number;

  @Column({ name: 'wastage_percentage', type: 'numeric', precision: 18, scale: 4, default: 0 })
  wastagePercentage: number;

  @ManyToOne(() => FabricCostingYarn, (yarn) => yarn.yarnWiseProcesses, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'fabric_costing_yarn_id' })
  fabricCostingYarn: FabricCostingYarn;

  @ManyToOne(() => FabricProcess, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'process_id' })
  process?: FabricProcess | null;
}
