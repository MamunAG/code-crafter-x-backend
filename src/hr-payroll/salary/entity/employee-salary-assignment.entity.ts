import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { HrTenantEntity } from '../../common/entity/hr-tenant.entity';
import { SalaryStructure } from '../../master-data/salary-structure/entity/salary-structure.entity';

@Entity('hr_employee_salary_assignments')
@Index('idx_hr_salary_assignment_effective', ['organizationId', 'employeeId', 'effectiveFrom'])
export class EmployeeSalaryAssignment extends HrTenantEntity {
  @Column({ name: 'employee_id', type: 'uuid' }) employeeId: string;
  @Column({ name: 'salary_structure_id', type: 'uuid' }) salaryStructureId: string;
  @ManyToOne(() => SalaryStructure, { nullable: false }) @JoinColumn({ name: 'salary_structure_id' }) salaryStructure: SalaryStructure;
  @Column({ name: 'effective_from', type: 'date' }) effectiveFrom: string;
  @Column({ name: 'effective_to', type: 'date', nullable: true }) effectiveTo?: string | null;
  @Column({ name: 'base_amount', type: 'numeric', precision: 18, scale: 4 }) baseAmount: string;
  @Column({ type: 'varchar', length: 3, default: 'BDT' }) currency: string;
  @Column({ name: 'component_overrides', type: 'jsonb', default: () => "'{}'::jsonb" }) componentOverrides: Record<string, number>;
}
