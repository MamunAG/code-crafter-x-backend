import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { PayrollRun } from './payroll-run.entity';

@Entity('hr_payroll_employees')
@Unique('uq_hr_payroll_employee', ['payrollRunId', 'employeeId'])
export class PayrollEmployee {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ name: 'payroll_run_id', type: 'uuid' }) payrollRunId: string;
  @ManyToOne(() => PayrollRun, { nullable: false }) @JoinColumn({ name: 'payroll_run_id' }) payrollRun: PayrollRun;
  @Column({ name: 'employee_id', type: 'uuid' }) employeeId: string;
  @Column({ name: 'employee_snapshot', type: 'jsonb' }) employeeSnapshot: Record<string, unknown>;
  @Column({ name: 'input_snapshot', type: 'jsonb' }) inputSnapshot: Record<string, unknown>;
  @Column({ name: 'gross_amount', type: 'numeric', precision: 18, scale: 4, default: 0 }) grossAmount: string;
  @Column({ name: 'deduction_amount', type: 'numeric', precision: 18, scale: 4, default: 0 }) deductionAmount: string;
  @Column({ name: 'employer_contribution_amount', type: 'numeric', precision: 18, scale: 4, default: 0 }) employerContributionAmount: string;
  @Column({ name: 'net_amount', type: 'numeric', precision: 18, scale: 4, default: 0 }) netAmount: string;
  @Column({ type: 'jsonb', default: () => "'[]'::jsonb" }) warnings: string[];
  @Column({ type: 'text', nullable: true }) error?: string | null;
}
