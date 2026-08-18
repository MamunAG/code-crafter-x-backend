import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { EmployeeLoan } from './employee-loan.entity';

@Entity('hr_loan_installments')
@Unique('uq_hr_loan_installment_period', ['loanId', 'dueDate'])
export class LoanInstallment {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ name: 'loan_id', type: 'uuid' }) loanId: string;
  @ManyToOne(() => EmployeeLoan, { nullable: false }) @JoinColumn({ name: 'loan_id' }) loan: EmployeeLoan;
  @Column({ name: 'due_date', type: 'date' }) dueDate: string;
  @Column({ type: 'numeric', precision: 18, scale: 4 }) amount: string;
  @Column({ name: 'paid_amount', type: 'numeric', precision: 18, scale: 4, default: 0 }) paidAmount: string;
  @Column({ name: 'payroll_employee_id', type: 'uuid', nullable: true }) payrollEmployeeId?: string | null;
  @Column({ name: 'paid_at', type: 'timestamptz', nullable: true }) paidAt?: Date | null;
}
