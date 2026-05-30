import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from 'src/common/entities/base.entity';
import { GmtCostScope } from 'src/merchandising/master-data/gmt-cost-scope/entity/gmt-cost-scope.entity';
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { FabricCostingYarn } from './fabric-costing-yarn.entity';

@Entity('fabric_costing_yarn_additional_cost')
export class FabricCostingYarnAdditionalCost extends BaseEntity {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'fabric_costing_yarn_id', type: 'uuid' })
  fabricCostingYarnId: string;

  @Column({ name: 'gmt_cost_scope_id', type: 'integer', nullable: true })
  gmtCostScopeId?: number | null;

  @Column({ name: 'percentage', type: 'numeric', precision: 18, scale: 4, default: 0 })
  percentage: number;

  @Column({ name: 'direct_cost', type: 'numeric', precision: 18, scale: 4, default: 0 })
  directCost: number;

  @ManyToOne(() => FabricCostingYarn, (yarn) => yarn.additionalMaterialCosts, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'fabric_costing_yarn_id' })
  fabricCostingYarn: FabricCostingYarn;

  @ManyToOne(() => GmtCostScope, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'gmt_cost_scope_id' })
  gmtCostScope?: GmtCostScope | null;
}
