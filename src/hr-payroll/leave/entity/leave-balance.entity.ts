import { Column, Entity, Unique } from 'typeorm';
import { HrTenantEntity } from '../../common/entity/hr-tenant.entity';

@Entity('hr_leave_balances')
@Unique('uq_hr_leave_balance_period', ['organizationId', 'employeeId', 'leaveTypeId', 'periodYear'])
export class LeaveBalance extends HrTenantEntity {
  @Column({ name: 'employee_id', type: 'uuid' }) employeeId: string;
  @Column({ name: 'leave_type_id', type: 'uuid' }) leaveTypeId: string;
  @Column({ name: 'period_year', type: 'integer' }) periodYear: number;
  @Column({ type: 'numeric', precision: 10, scale: 2, default: 0 }) opening: string;
  @Column({ type: 'numeric', precision: 10, scale: 2, default: 0 }) accrued: string;
  @Column({ type: 'numeric', precision: 10, scale: 2, default: 0 }) used: string;
  @Column({ type: 'numeric', precision: 10, scale: 2, default: 0 }) adjusted: string;
  @Column({ type: 'numeric', precision: 10, scale: 2, default: 0 }) encashed: string;
}
