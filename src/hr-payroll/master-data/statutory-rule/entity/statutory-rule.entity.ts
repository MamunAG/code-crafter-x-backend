import { Column, Entity, Unique } from 'typeorm';
import { ApprovalStatus } from '../../../common/hr.enums';
import { HrTenantEntity } from '../../../common/entity/hr-tenant.entity';

@Entity('hr_statutory_rule_packs')
@Unique('uq_hr_rule_pack_version', ['organizationId', 'code', 'version'])
export class StatutoryRulePack extends HrTenantEntity {
  @Column({ type: 'varchar', length: 80 }) code: string;
  @Column({ type: 'varchar', length: 255 }) name: string;
  @Column({ type: 'varchar', length: 80, default: 'BD' }) jurisdiction: string;
  @Column({ type: 'integer' }) version: number;
  @Column({ name: 'effective_from', type: 'date' }) effectiveFrom: string;
  @Column({ name: 'effective_to', type: 'date', nullable: true }) effectiveTo?: string | null;
  @Column({ type: 'jsonb' }) rules: Record<string, unknown>;
  @Column({ name: 'source_url', type: 'text' }) sourceUrl: string;
  @Column({ name: 'source_published_at', type: 'date', nullable: true }) sourcePublishedAt?: string | null;
  @Column({ name: 'review_status', type: 'enum', enum: ApprovalStatus, default: ApprovalStatus.Draft }) reviewStatus: ApprovalStatus;
  @Column({ name: 'approved_by_id', type: 'uuid', nullable: true }) approvedById?: string | null;
  @Column({ name: 'approved_at', type: 'timestamptz', nullable: true }) approvedAt?: Date | null;
  @Column({ name: 'locked_at', type: 'timestamptz', nullable: true }) lockedAt?: Date | null;
}
