import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { ApprovalStatus } from '../../common/hr.enums';
import { HrTenantEntity } from '../../common/entity/hr-tenant.entity';
import { AttendanceDay } from './attendance-day.entity';

@Entity('hr_attendance_corrections')
@Index('idx_hr_attendance_correction_day', ['organizationId', 'attendanceDayId', 'status'])
export class AttendanceCorrection extends HrTenantEntity {
  @Column({ name: 'attendance_day_id', type: 'uuid' }) attendanceDayId: string;
  @ManyToOne(() => AttendanceDay, { nullable: false }) @JoinColumn({ name: 'attendance_day_id' }) attendanceDay: AttendanceDay;
  @Column({ name: 'requested_values', type: 'jsonb' }) requestedValues: Record<string, unknown>;
  @Column({ type: 'text' }) reason: string;
  @Column({ type: 'enum', enum: ApprovalStatus, default: ApprovalStatus.Pending }) status: ApprovalStatus;
  @Column({ name: 'decided_by_id', type: 'uuid', nullable: true }) decidedById?: string | null;
  @Column({ name: 'decided_at', type: 'timestamptz', nullable: true }) decidedAt?: Date | null;
  @Column({ name: 'decision_comment', type: 'text', nullable: true }) decisionComment?: string | null;
}
