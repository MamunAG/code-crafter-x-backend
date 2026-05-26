import { ApiProperty } from '@nestjs/swagger';
import { Currency } from 'src/app-configuration/currency/entity/currency.entity';
import { Material } from 'src/app-configuration/material/entity/material.entity';
import { Organization } from 'src/app-configuration/organization/entity/organization.entity';
import { Unit } from 'src/app-configuration/unit/entity/unit.entity';
import { BaseEntity } from 'src/common/entities/base.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { FabricCostingCommonProcess } from './fabric-costing-common-process.entity';
import { FabricCostingYarn } from './fabric-costing-yarn.entity';

@Entity('fabric_costing')
export class FabricCosting extends BaseEntity {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ required: false, nullable: true })
  @Column({ name: 'fabric_id', type: 'uuid', nullable: true })
  fabricId?: string | null;

  @ApiProperty({ example: 1 })
  @Column({ name: 'qty', type: 'numeric', precision: 18, scale: 4, default: 1 })
  qty: number;

  @ApiProperty({ required: false, nullable: true })
  @Column({ name: 'unit_id', type: 'integer', nullable: true })
  unitId?: number | null;

  @ApiProperty()
  @Column({ name: 'currency_id', type: 'integer', nullable: false })
  currencyId: number;

  @ApiProperty({ example: 'Main fabric costing', required: false, nullable: true })
  @Column({ name: 'cost_name', type: 'varchar', length: 255, nullable: true })
  costName?: string | null;

  @ApiProperty({ required: false, nullable: true })
  @Column({ name: 'organization_id', type: 'uuid', nullable: true })
  organizationId?: string | null;

  @ManyToOne(() => Material, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'fabric_id' })
  fabric?: Material | null;

  @ManyToOne(() => Unit, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'unit_id' })
  unit?: Unit | null;

  @ManyToOne(() => Currency, { nullable: false })
  @JoinColumn({ name: 'currency_id' })
  currency: Currency;

  @ManyToOne(() => Organization, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organization_id' })
  organization?: Organization | null;

  @OneToMany(() => FabricCostingYarn, (yarn) => yarn.fabricCosting, {
    cascade: true,
  })
  yarns?: FabricCostingYarn[];

  @OneToMany(
    () => FabricCostingCommonProcess,
    (process) => process.fabricCosting,
    { cascade: true },
  )
  commonProcesses?: FabricCostingCommonProcess[];
}
