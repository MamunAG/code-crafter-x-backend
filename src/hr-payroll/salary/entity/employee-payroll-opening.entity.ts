import { Column, Entity, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { HrTenantEntity } from '../../common/entity/hr-tenant.entity';
import { Employee } from '../../employee/entity/employee.entity';

@Entity('hr_employee_payroll_opening')
@Unique('uq_hr_payroll_opening_year', ['organizationId', 'employeeId', 'taxYear'])
export class EmployeePayrollOpening extends HrTenantEntity {
  @Column({ name: 'employee_id', type: 'uuid' }) employeeId: string;
  @ManyToOne(() => Employee, { nullable: false }) @JoinColumn({ name: 'employee_id', foreignKeyConstraintName: 'FK_hr_opening_employee' }) employee: Employee;
  @Column({ name: 'tax_year', type: 'integer' }) taxYear: number;
  @Column({ name: 'taxable_income', type: 'numeric', precision: 18, scale: 4, default: 0 }) taxableIncome: string;
  @Column({ name: 'tax_withheld', type: 'numeric', precision: 18, scale: 4, default: 0 }) taxWithheld: string;
  @Column({ type: 'jsonb', default: () => "'{}'::jsonb" }) earnings: Record<string, number>;
  @Column({ type: 'jsonb', default: () => "'{}'::jsonb" }) deductions: Record<string, number>;
}
