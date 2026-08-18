import { Column, Entity, Unique } from 'typeorm';
import { HrTenantEntity } from '../../../common/entity/hr-tenant.entity';

@Entity('hr_shifts')
@Unique('uq_hr_shift_org_code', ['organizationId', 'code'])
export class Shift extends HrTenantEntity {
  @Column({ type: 'varchar', length: 80 }) code: string;
  @Column({ type: 'varchar', length: 255 }) name: string;
  @Column({ name: 'start_time', type: 'time' }) startTime: string;
  @Column({ name: 'end_time', type: 'time' }) endTime: string;
  @Column({ name: 'break_minutes', type: 'integer', default: 0 }) breakMinutes: number;
  @Column({ name: 'grace_in_minutes', type: 'integer', default: 0 }) graceInMinutes: number;
  @Column({ name: 'grace_out_minutes', type: 'integer', default: 0 }) graceOutMinutes: number;
  @Column({ name: 'overtime_after_minutes', type: 'integer', default: 0 }) overtimeAfterMinutes: number;
  @Column({ name: 'is_overnight', default: false }) isOvernight: boolean;
  @Column({ name: 'is_flexible', default: false }) isFlexible: boolean;
  @Column({ name: 'is_active', default: true }) isActive: boolean;
}
