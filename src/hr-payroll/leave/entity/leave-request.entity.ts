import { Column, Entity, Index } from 'typeorm';
import { ApprovalStatus } from '../../common/hr.enums';
import { HrTenantEntity } from '../../common/entity/hr-tenant.entity';

@Entity('hr_leave_requests')
@Index('idx_hr_leave_employee_dates', ['organizationId', 'employeeId', 'startDate', 'endDate'])
export class LeaveRequest extends HrTenantEntity {
  @Column({ name: 'application_number', type: 'varchar', length: 40, nullable: true }) applicationNumber?: string | null;
  @Column({ name: 'employee_id', type: 'uuid' }) employeeId: string;
  @Column({ name: 'leave_type_id', type: 'uuid' }) leaveTypeId: string;
  @Column({ name: 'start_date', type: 'date' }) startDate: string;
  @Column({ name: 'end_date', type: 'date' }) endDate: string;
  @Column({ type: 'numeric', precision: 10, scale: 2 }) days: string;
  @Column({ name: 'is_half_day', default: false }) isHalfDay: boolean;
  @Column({ name: 'duration_type', type: 'varchar', length: 30, default: 'FULL_DAY' }) durationType: string;
  @Column({ type: 'text', nullable: true }) reason?: string | null;
  @Column({ name: 'contact_during_leave', type: 'varchar', length: 255, nullable: true }) contactDuringLeave?: string | null;
  @Column({ name: 'attachment_url', type: 'text', nullable: true }) attachmentUrl?: string | null;
  @Column({ name: 'day_breakdown', type: 'jsonb', default: () => "'[]'::jsonb" }) dayBreakdown: Array<Record<string, unknown>>;
  @Column({ type: 'enum', enum: ApprovalStatus, default: ApprovalStatus.Draft }) status: ApprovalStatus;
  @Column({ name: 'approval_level', type: 'smallint', default: 0 }) approvalLevel: number;
  @Column({ name: 'required_approval_levels', type: 'smallint', default: 1 }) requiredApprovalLevels: number;
  @Column({ name: 'approval_history', type: 'jsonb', default: () => "'[]'::jsonb" }) approvalHistory: Array<Record<string, unknown>>;
}
