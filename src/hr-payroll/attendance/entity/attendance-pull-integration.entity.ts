import { Column, Entity, Index, Unique } from 'typeorm';
import { EncryptedJsonTransformer } from 'src/common/transformers/encrypted-json.transformer';
import { HrTenantEntity } from '../../common/entity/hr-tenant.entity';
import { AttendancePullMethod } from '../attendance-pull.types';
import type {
  AttendancePullFieldMapping,
  AttendancePullRequestConfig,
} from '../attendance-pull.types';

@Entity('hr_attendance_pull_integrations')
@Unique('uq_hr_attendance_pull_source', ['organizationId', 'source'])
@Index('idx_hr_attendance_pull_due', ['isActive', 'nextRunAt'])
export class AttendancePullIntegration extends HrTenantEntity {
  @Column({ type: 'varchar', length: 160 }) name: string;
  @Column({ type: 'varchar', length: 120 }) source: string;
  @Column({ name: 'endpoint_url', type: 'text' }) endpointUrl: string;
  @Column({ type: 'varchar', length: 10 }) method: AttendancePullMethod;
  @Column({
    name: 'request_config',
    type: 'text',
    transformer: new EncryptedJsonTransformer<AttendancePullRequestConfig>(),
  })
  requestConfig: AttendancePullRequestConfig;
  @Column({
    name: 'response_items_path',
    type: 'varchar',
    length: 500,
    nullable: true,
  })
  responseItemsPath?: string | null;
  @Column({ type: 'jsonb', default: () => "'[]'::jsonb" })
  mappings: AttendancePullFieldMapping[];
  @Column({
    name: 'direction_map',
    type: 'jsonb',
    default: () => "'{}'::jsonb",
  })
  directionMap: Record<string, string>;
  @Column({
    name: 'cursor_response_path',
    type: 'varchar',
    length: 500,
    nullable: true,
  })
  cursorResponsePath?: string | null;
  @Column({ name: 'last_cursor', type: 'text', nullable: true }) lastCursor?:
    | string
    | null;
  @Column({
    name: 'schedule_interval_minutes',
    type: 'integer',
    nullable: true,
  })
  scheduleIntervalMinutes?: number | null;
  @Column({ name: 'is_active', type: 'boolean', default: false })
  isActive: boolean;
  @Column({ name: 'next_run_at', type: 'timestamptz', nullable: true })
  nextRunAt?: Date | null;
  @Column({ name: 'last_run_at', type: 'timestamptz', nullable: true })
  lastRunAt?: Date | null;
  @Column({ name: 'last_success_at', type: 'timestamptz', nullable: true })
  lastSuccessAt?: Date | null;
  @Column({ name: 'last_status', type: 'varchar', length: 30, nullable: true })
  lastStatus?: string | null;
  @Column({ name: 'last_error', type: 'text', nullable: true }) lastError?:
    | string
    | null;
  @Column({ name: 'last_result', type: 'jsonb', nullable: true })
  lastResult?: Record<string, unknown> | null;
  @Column({ name: 'sync_locked_until', type: 'timestamptz', nullable: true })
  syncLockedUntil?: Date | null;
}
