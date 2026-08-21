import { Column, Entity, Index, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { Factory } from 'src/app-configuration/factory/entity/factory.entity';
import { PayrollFrequency, PayrollProcessingMode, PayrollRunStatus, PayrollRunType } from '../../common/hr.enums';
import { HrTenantEntity } from '../../common/entity/hr-tenant.entity';

@Entity('hr_payroll_runs')
@Unique('uq_hr_payroll_run_scope', ['organizationId', 'factoryId', 'payGroupId', 'periodStart', 'periodEnd', 'runType', 'sequence', 'processingMode', 'selectionCriteria'])
@Unique('uq_hr_payroll_idempotency', ['organizationId', 'idempotencyKey'])
export class PayrollRun extends HrTenantEntity {
  @Column({ name: 'idempotency_key', type: 'varchar', length: 120 }) idempotencyKey: string;
  @Column({ name: 'factory_id', type: 'uuid' }) factoryId: string;
  @ManyToOne(() => Factory, { nullable: false }) @JoinColumn({ name: 'factory_id' }) factory: Factory;
  @Column({ name: 'pay_group_id', type: 'uuid' }) payGroupId: string;
  @Column({ name: 'processing_mode', type: 'enum', enum: PayrollProcessingMode, default: PayrollProcessingMode.Bulk }) processingMode: PayrollProcessingMode;
  @Column({ name: 'selection_criteria', type: 'jsonb', default: () => "'{}'::jsonb" }) selectionCriteria: Record<string, unknown>;
  @Column({ name: 'formula_inputs', type: 'jsonb', default: () => "'{}'::jsonb" }) formulaInputs: Record<string, number>;
  @Column({ type: 'enum', enum: PayrollFrequency }) frequency: PayrollFrequency;
  @Column({ name: 'run_type', type: 'enum', enum: PayrollRunType }) runType: PayrollRunType;
  @Column({ type: 'smallint', default: 1 }) sequence: number;
  @Column({ name: 'period_start', type: 'date' }) periodStart: string;
  @Column({ name: 'period_end', type: 'date' }) periodEnd: string;
  @Column({ name: 'payment_date', type: 'date' }) paymentDate: string;
  @Index() @Column({ type: 'enum', enum: PayrollRunStatus, default: PayrollRunStatus.Draft }) status: PayrollRunStatus;
  @Column({ type: 'varchar', length: 3, default: 'BDT' }) currency: string;
  @Column({ name: 'rule_pack_id', type: 'uuid', nullable: true }) rulePackId?: string | null;
  @Column({ name: 'snapshot_metadata', type: 'jsonb', default: () => "'{}'::jsonb" }) snapshotMetadata: Record<string, unknown>;
  @Column({ name: 'prepared_by_id', type: 'uuid', nullable: true }) preparedById?: string | null;
  @Column({ name: 'reviewed_by_id', type: 'uuid', nullable: true }) reviewedById?: string | null;
  @Column({ name: 'approved_by_id', type: 'uuid', nullable: true }) approvedById?: string | null;
  @Column({ name: 'locked_by_id', type: 'uuid', nullable: true }) lockedById?: string | null;
  @Column({ name: 'locked_at', type: 'timestamptz', nullable: true }) lockedAt?: Date | null;
  @Column({ name: 'paid_status', type: 'varchar', length: 30, default: 'UNPAID' }) paidStatus: string;
  @Column({ name: 'reversal_of_run_id', type: 'uuid', nullable: true }) reversalOfRunId?: string | null;
}
