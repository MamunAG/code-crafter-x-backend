import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('audit_events')
@Index('idx_audit_tenant_subject', [
  'organizationId',
  'subjectType',
  'subjectId',
])
export class AuditEvent {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ name: 'module_name', type: 'varchar', length: 80 })
  moduleName: string;
  @Column({ type: 'varchar', length: 30, default: 'BUSINESS' })
  category: string;
  @Column({ type: 'varchar', length: 30, default: 'SUCCESS' }) status: string;
  @Column({ name: 'organization_id', type: 'uuid', nullable: true })
  organizationId?: string | null;
  @Column({ name: 'actor_id', type: 'uuid', nullable: true }) actorId?:
    | string
    | null;
  @Column({ name: 'actor_name', type: 'varchar', length: 255, nullable: true })
  actorName?: string | null;
  @Column({ type: 'varchar', length: 120 }) action: string;
  @Column({ name: 'subject_type', type: 'varchar', length: 120 })
  subjectType: string;
  @Column({ name: 'subject_id', type: 'varchar', length: 120 })
  subjectId: string;
  @Column({ name: 'http_method', type: 'varchar', length: 12, nullable: true })
  httpMethod?: string | null;
  @Column({ type: 'varchar', length: 500, nullable: true }) route?:
    | string
    | null;
  @Column({ name: 'status_code', type: 'integer', nullable: true })
  statusCode?: number | null;
  @Column({ name: 'request_id', type: 'varchar', length: 120, nullable: true })
  requestId?: string | null;
  @Column({ name: 'duration_ms', type: 'integer', nullable: true })
  durationMs?: number | null;
  @Column({ name: 'error_code', type: 'varchar', length: 120, nullable: true })
  errorCode?: string | null;
  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage?: string | null;
  @Column({ name: 'client_ip', type: 'varchar', length: 64, nullable: true })
  clientIp?: string | null;
  @Column({ name: 'user_agent', type: 'text', nullable: true }) userAgent?:
    | string
    | null;
  @Column({ name: 'job_name', type: 'varchar', length: 160, nullable: true })
  jobName?: string | null;
  @Column({ type: 'varchar', length: 160, nullable: true }) schedule?:
    | string
    | null;
  @Column({ name: 'run_id', type: 'uuid', nullable: true }) runId?:
    | string
    | null;
  @Column({ name: 'scheduled_for', type: 'timestamptz', nullable: true })
  scheduledFor?: Date | null;
  @Column({ name: 'started_at', type: 'timestamptz', nullable: true })
  startedAt?: Date | null;
  @Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
  completedAt?: Date | null;
  @Column({
    name: 'schedule_status',
    type: 'varchar',
    length: 30,
    nullable: true,
  })
  scheduleStatus?: string | null;
  @Column({ name: 'before_state', type: 'jsonb', nullable: true })
  beforeState?: Record<string, unknown> | null;
  @Column({ name: 'after_state', type: 'jsonb', nullable: true })
  afterState?: Record<string, unknown> | null;
  @Column({ type: 'jsonb', default: () => "'{}'::jsonb" }) metadata: Record<
    string,
    unknown
  >;
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
