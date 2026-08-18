import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { EmployeeLifecycleAction } from '../../common/hr.enums';
import { HrTenantEntity } from '../../common/entity/hr-tenant.entity';
import { Employee } from './employee.entity';

@Entity('hr_employee_employment_history')
@Index('idx_hr_employment_history_effective', ['organizationId', 'employeeId', 'effectiveFrom'])
export class EmployeeEmploymentHistory extends HrTenantEntity {
  @Column({ name: 'employee_id', type: 'uuid' }) employeeId: string;
  @ManyToOne(() => Employee, { nullable: false }) @JoinColumn({ name: 'employee_id' }) employee: Employee;
  @Column({ type: 'enum', enum: EmployeeLifecycleAction }) action: EmployeeLifecycleAction;
  @Column({ name: 'effective_from', type: 'date' }) effectiveFrom: string;
  @Column({ name: 'effective_to', type: 'date', nullable: true }) effectiveTo?: string | null;
  @Column({ name: 'factory_id', type: 'uuid', nullable: true }) factoryId?: string | null;
  @Column({ name: 'department_id', type: 'uuid', nullable: true }) departmentId?: string | null;
  @Column({ name: 'designation_id', type: 'uuid', nullable: true }) designationId?: string | null;
  @Column({ name: 'supervisor_id', type: 'uuid', nullable: true }) supervisorId?: string | null;
  @Column({ name: 'grade_id', type: 'uuid', nullable: true }) gradeId?: string | null;
  @Column({ name: 'pay_group_id', type: 'uuid', nullable: true }) payGroupId?: string | null;
  @Column({ type: 'text', nullable: true }) reason?: string | null;
}
