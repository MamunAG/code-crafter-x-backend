import { Column, Entity, Unique } from 'typeorm';
import { HrTenantEntity } from '../../common/entity/hr-tenant.entity';

@Entity('hr_attendance_integration_credentials')
@Unique('uq_hr_attendance_credential_source', ['organizationId', 'source'])
export class AttendanceIntegrationCredential extends HrTenantEntity {
  @Column({ type: 'varchar', length: 120 }) source: string;
  @Column({ name: 'key_prefix', type: 'varchar', length: 16 }) keyPrefix: string;
  @Column({ name: 'secret_hash', type: 'varchar', length: 255 }) secretHash: string;
  @Column({ name: 'allowed_ips', type: 'text', array: true, default: () => "'{}'" }) allowedIps: string[];
  @Column({ name: 'revoked_at', type: 'timestamptz', nullable: true }) revokedAt?: Date | null;
  @Column({ name: 'last_used_at', type: 'timestamptz', nullable: true }) lastUsedAt?: Date | null;
}
