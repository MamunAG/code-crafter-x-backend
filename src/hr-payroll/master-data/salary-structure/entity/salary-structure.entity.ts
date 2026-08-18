import { Column, Entity, Unique } from 'typeorm';
import { HrTenantEntity } from '../../../common/entity/hr-tenant.entity';

@Entity('hr_salary_structures')
@Unique('uq_hr_salary_structure_version', ['organizationId', 'code', 'version'])
export class SalaryStructure extends HrTenantEntity {
  @Column({ type: 'varchar', length: 80 }) code: string;
  @Column({ type: 'varchar', length: 255 }) name: string;
  @Column({ type: 'integer', default: 1 }) version: number;
  @Column({ name: 'effective_from', type: 'date' }) effectiveFrom: string;
  @Column({ name: 'effective_to', type: 'date', nullable: true }) effectiveTo?: string | null;
  @Column({ name: 'is_active', default: false }) isActive: boolean;
  @Column({ name: 'locked_at', type: 'timestamptz', nullable: true }) lockedAt?: Date | null;
}
