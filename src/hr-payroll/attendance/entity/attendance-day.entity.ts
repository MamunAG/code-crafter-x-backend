import { Column, Entity, Unique } from 'typeorm';
import { AttendanceStatus } from '../../common/hr.enums';
import { HrTenantEntity } from '../../common/entity/hr-tenant.entity';

@Entity('hr_attendance_days')
@Unique('uq_hr_attendance_day', ['organizationId', 'employeeId', 'workDate'])
export class AttendanceDay extends HrTenantEntity {
  @Column({ name: 'employee_id', type: 'uuid' }) employeeId: string;
  @Column({ name: 'work_date', type: 'date' }) workDate: string;
  @Column({ name: 'shift_id', type: 'uuid', nullable: true }) shiftId?: string | null;
  @Column({ type: 'enum', enum: AttendanceStatus }) status: AttendanceStatus;
  @Column({ name: 'first_in', type: 'timestamptz', nullable: true }) firstIn?: Date | null;
  @Column({ name: 'last_out', type: 'timestamptz', nullable: true }) lastOut?: Date | null;
  @Column({ name: 'worked_minutes', type: 'integer', default: 0 }) workedMinutes: number;
  @Column({ name: 'late_minutes', type: 'integer', default: 0 }) lateMinutes: number;
  @Column({ name: 'early_exit_minutes', type: 'integer', default: 0 }) earlyExitMinutes: number;
  @Column({ name: 'overtime_minutes', type: 'integer', default: 0 }) overtimeMinutes: number;
  @Column({ name: 'is_finalized', default: false }) isFinalized: boolean;
  @Column({ name: 'calculation_trace', type: 'jsonb', default: () => "'{}'::jsonb" }) calculationTrace: Record<string, unknown>;
}
