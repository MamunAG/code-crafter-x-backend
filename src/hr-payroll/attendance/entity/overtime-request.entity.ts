import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { ApprovalStatus } from '../../common/hr.enums';
import { HrTenantEntity } from '../../common/entity/hr-tenant.entity';
import { Employee } from '../../employee/entity/employee.entity';

@Entity('hr_overtime_requests')
@Index('idx_hr_overtime_employee_date', ['organizationId', 'employeeId', 'workDate'])
export class OvertimeRequest extends HrTenantEntity {
  @Column({ name: 'employee_id', type: 'uuid' }) employeeId: string;
  @ManyToOne(() => Employee, { nullable: false }) @JoinColumn({ name: 'employee_id', foreignKeyConstraintName: 'FK_hr_overtime_employee' }) employee: Employee;
  @Column({ name: 'work_date', type: 'date' }) workDate: string;
  @Column({ name: 'requested_minutes', type: 'integer' }) requestedMinutes: number;
  @Column({ name: 'approved_minutes', type: 'integer', nullable: true }) approvedMinutes?: number | null;
  @Column({ type: 'text', nullable: true }) reason?: string | null;
  @Column({ type: 'enum', enum: ApprovalStatus, default: ApprovalStatus.Pending }) status: ApprovalStatus;
  @Column({ name: 'decided_by_id', type: 'uuid', nullable: true }) decidedById?: string | null;
  @Column({ name: 'decided_at', type: 'timestamptz', nullable: true }) decidedAt?: Date | null;
}
