import { Column, Entity, Index } from 'typeorm';
import { LoanStatus } from '../../common/hr.enums';
import { HrTenantEntity } from '../../common/entity/hr-tenant.entity';

@Entity('hr_loans')
@Index('idx_hr_loan_employee', ['organizationId', 'employeeId', 'status'])
export class EmployeeLoan extends HrTenantEntity {
  @Column({ name: 'employee_id', type: 'uuid' }) employeeId: string;
  @Column({ name: 'loan_number', type: 'varchar', length: 80 }) loanNumber: string;
  @Column({ type: 'numeric', precision: 18, scale: 4 }) principal: string;
  @Column({ name: 'installment_amount', type: 'numeric', precision: 18, scale: 4 }) installmentAmount: string;
  @Column({ name: 'outstanding_amount', type: 'numeric', precision: 18, scale: 4 }) outstandingAmount: string;
  @Column({ type: 'enum', enum: LoanStatus, default: LoanStatus.Draft }) status: LoanStatus;
  @Column({ name: 'start_date', type: 'date' }) startDate: string;
  @Column({ type: 'text', nullable: true }) remarks?: string | null;
}
