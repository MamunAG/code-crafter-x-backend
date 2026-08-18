import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { PayrollComponentType } from '../../common/hr.enums';
import { PayrollEmployee } from './payroll-employee.entity';

@Entity('hr_payroll_lines')
@Unique('uq_hr_payroll_line_component', ['payrollEmployeeId', 'componentCode'])
export class PayrollLine {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ name: 'payroll_employee_id', type: 'uuid' }) payrollEmployeeId: string;
  @ManyToOne(() => PayrollEmployee, { nullable: false }) @JoinColumn({ name: 'payroll_employee_id' }) payrollEmployee: PayrollEmployee;
  @Column({ name: 'component_code', type: 'varchar', length: 80 }) componentCode: string;
  @Column({ name: 'component_name', type: 'varchar', length: 255 }) componentName: string;
  @Column({ name: 'component_name_bn', type: 'varchar', length: 255, nullable: true }) componentNameBn?: string | null;
  @Column({ type: 'enum', enum: PayrollComponentType }) type: PayrollComponentType;
  @Column({ type: 'numeric', precision: 18, scale: 4 }) amount: string;
  @Column({ type: 'text' }) formula: string;
  @Column({ name: 'formula_version', type: 'integer' }) formulaVersion: number;
  @Column({ name: 'calculation_trace', type: 'jsonb' }) calculationTrace: Record<string, unknown>;
}
