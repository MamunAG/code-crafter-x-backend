import { Column, Entity, Index } from 'typeorm';
import { ApprovalStatus } from '../../common/hr.enums';
import { HrTenantEntity } from '../../common/entity/hr-tenant.entity';

@Entity('hr_leave_requests')
@Index('idx_hr_leave_employee_dates', ['organizationId', 'employeeId', 'startDate', 'endDate'])
export class LeaveRequest extends HrTenantEntity {
  @Column({ name: 'employee_id', type: 'uuid' }) employeeId: string;
  @Column({ name: 'leave_type_id', type: 'uuid' }) leaveTypeId: string;
  @Column({ name: 'start_date', type: 'date' }) startDate: string;
  @Column({ name: 'end_date', type: 'date' }) endDate: string;
  @Column({ type: 'numeric', precision: 10, scale: 2 }) days: string;
  @Column({ name: 'is_half_day', default: false }) isHalfDay: boolean;
  @Column({ type: 'text', nullable: true }) reason?: string | null;
  @Column({ type: 'enum', enum: ApprovalStatus, default: ApprovalStatus.Draft }) status: ApprovalStatus;
  @Column({ name: 'approval_level', type: 'smallint', default: 0 }) approvalLevel: number;
  @Column({ name: 'required_approval_levels', type: 'smallint', default: 1 }) requiredApprovalLevels: number;
  @Column({ name: 'approval_history', type: 'jsonb', default: () => "'[]'::jsonb" }) approvalHistory: Array<Record<string, unknown>>;
}
