import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { PayrollComponentType } from '../../../common/hr.enums';
import { SalaryStructure } from './salary-structure.entity';

@Entity('hr_salary_structure_components')
@Unique('uq_hr_structure_component', ['salaryStructureId', 'code'])
export class SalaryStructureComponent {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ name: 'salary_structure_id', type: 'uuid' }) salaryStructureId: string;
  @ManyToOne(() => SalaryStructure, { nullable: false }) @JoinColumn({ name: 'salary_structure_id' }) salaryStructure: SalaryStructure;
  @Column({ type: 'varchar', length: 80 }) code: string;
  @Column({ type: 'varchar', length: 255 }) name: string;
  @Column({ name: 'name_bn', type: 'varchar', length: 255, nullable: true }) nameBn?: string | null;
  @Column({ type: 'enum', enum: PayrollComponentType }) type: PayrollComponentType;
  @Column({ type: 'text' }) formula: string;
  @Column({ name: 'sort_order', type: 'integer', default: 0 }) sortOrder: number;
  @Column({ name: 'is_taxable', default: false }) isTaxable: boolean;
}
