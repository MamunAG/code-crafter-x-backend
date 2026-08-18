import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { HrTenantEntity } from '../../common/entity/hr-tenant.entity';
import { Employee } from '../../employee/entity/employee.entity';
import { Shift } from '../../master-data/shift/entity/shift.entity';

@Entity('hr_roster_assignments')
@Index('idx_hr_roster_employee_dates', ['organizationId', 'employeeId', 'effectiveFrom', 'effectiveTo'])
export class RosterAssignment extends HrTenantEntity {
  @Column({ name: 'employee_id', type: 'uuid' }) employeeId: string;
  @ManyToOne(() => Employee, { nullable: false }) @JoinColumn({ name: 'employee_id' }) employee: Employee;
  @Column({ name: 'shift_id', type: 'uuid' }) shiftId: string;
  @ManyToOne(() => Shift, { nullable: false }) @JoinColumn({ name: 'shift_id' }) shift: Shift;
  @Column({ name: 'effective_from', type: 'date' }) effectiveFrom: string;
  @Column({ name: 'effective_to', type: 'date', nullable: true }) effectiveTo?: string | null;
  @Column({ name: 'weekly_off_days', type: 'smallint', array: true, default: () => "'{5}'" }) weeklyOffDays: number[];
}
