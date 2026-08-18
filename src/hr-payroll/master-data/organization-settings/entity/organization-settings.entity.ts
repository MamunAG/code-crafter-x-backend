import { Column, Entity, Unique } from 'typeorm';
import { HrTenantEntity } from '../../../common/entity/hr-tenant.entity';

@Entity('hr_organization_settings')
@Unique('uq_hr_organization_settings', ['organizationId'])
export class OrganizationSettings extends HrTenantEntity {
  @Column({ type: 'varchar', length: 80, default: 'Asia/Dhaka' }) timezone: string;
  @Column({ type: 'varchar', length: 3, default: 'BDT' }) currency: string;
  @Column({ name: 'leave_approval_levels', type: 'smallint', default: 1 }) leaveApprovalLevels: number;
  @Column({ name: 'attendance_rounding_minutes', type: 'smallint', default: 1 }) attendanceRoundingMinutes: number;
  @Column({ name: 'overtime_cap_minutes', type: 'integer', nullable: true }) overtimeCapMinutes?: number | null;
  @Column({ name: 'settings', type: 'jsonb', default: () => "'{}'::jsonb" }) settings: Record<string, unknown>;
}
