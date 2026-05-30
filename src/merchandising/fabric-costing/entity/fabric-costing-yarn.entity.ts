import { ApiProperty } from '@nestjs/swagger';
import { Material } from 'src/app-configuration/material/entity/material.entity';
import { BaseEntity } from 'src/common/entities/base.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { FabricCosting } from './fabric-costing.entity';
import { FabricCostingYarnProcess } from './fabric-costing-yarn-process.entity';
import { FabricCostingYarnAdditionalCost } from './fabric-costing-yarn-additional-cost.entity';

@Entity('fabric_costing_yarn')
export class FabricCostingYarn extends BaseEntity {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'fabric_costing_id', type: 'uuid' })
  fabricCostingId: string;

  @Column({ name: 'yarn_id', type: 'uuid', nullable: true })
  yarnId?: string | null;

  @Column({ name: 'percentage_unit_fabric', type: 'numeric', precision: 18, scale: 4, default: 0 })
  percentagePerUnitFabric: number;

  @Column({ name: 'yarn_price_unit', type: 'numeric', precision: 18, scale: 4, default: 0 })
  yarnPricePerUnit: number;

  @Column({ name: 'total_yarn_price', type: 'numeric', precision: 18, scale: 4, default: 0 })
  totalYarnPrice: number;

  @ManyToOne(() => FabricCosting, (fabricCosting) => fabricCosting.yarns, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'fabric_costing_id' })
  fabricCosting: FabricCosting;

  @ManyToOne(() => Material, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'yarn_id' })
  yarn?: Material | null;

  @OneToMany(
    () => FabricCostingYarnProcess,
    (process) => process.fabricCostingYarn,
    { cascade: true },
  )
  yarnWiseProcesses?: FabricCostingYarnProcess[];

  @OneToMany(
    () => FabricCostingYarnAdditionalCost,
    (additionalCost) => additionalCost.fabricCostingYarn,
    { cascade: true },
  )
  additionalMaterialCosts?: FabricCostingYarnAdditionalCost[];
}
