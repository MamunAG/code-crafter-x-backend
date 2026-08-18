import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('hr_audit_events')
@Index('idx_hr_audit_tenant_subject', ['organizationId', 'subjectType', 'subjectId'])
export class AuditEvent {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ name: 'organization_id', type: 'uuid' }) organizationId: string;
  @Column({ name: 'actor_id', type: 'uuid', nullable: true }) actorId?: string | null;
  @Column({ type: 'varchar', length: 120 }) action: string;
  @Column({ name: 'subject_type', type: 'varchar', length: 120 }) subjectType: string;
  @Column({ name: 'subject_id', type: 'varchar', length: 120 }) subjectId: string;
  @Column({ name: 'before_state', type: 'jsonb', nullable: true }) beforeState?: Record<string, unknown> | null;
  @Column({ name: 'after_state', type: 'jsonb', nullable: true }) afterState?: Record<string, unknown> | null;
  @Column({ type: 'jsonb', default: () => "'{}'::jsonb" }) metadata: Record<string, unknown>;
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' }) createdAt: Date;
}
