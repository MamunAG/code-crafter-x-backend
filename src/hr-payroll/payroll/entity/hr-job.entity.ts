import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { HrJobStatus } from '../../common/hr.enums';

@Entity('hr_jobs')
@Index('idx_hr_job_claim', ['status', 'availableAt', 'leaseExpiresAt'])
export class HrJob {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ name: 'organization_id', type: 'uuid' }) organizationId: string;
  @Column({ type: 'varchar', length: 80 }) type: string;
  @Column({ type: 'enum', enum: HrJobStatus, default: HrJobStatus.Queued }) status: HrJobStatus;
  @Column({ type: 'jsonb' }) payload: Record<string, unknown>;
  @Column({ type: 'integer', default: 0 }) attempts: number;
  @Column({ name: 'max_attempts', type: 'integer', default: 3 }) maxAttempts: number;
  @Column({ type: 'integer', default: 0 }) progress: number;
  @Column({ name: 'available_at', type: 'timestamptz', default: () => 'now()' }) availableAt: Date;
  @Column({ name: 'lease_owner', type: 'varchar', length: 120, nullable: true }) leaseOwner?: string | null;
  @Column({ name: 'lease_expires_at', type: 'timestamptz', nullable: true }) leaseExpiresAt?: Date | null;
  @Column({ type: 'jsonb', nullable: true }) result?: Record<string, unknown> | null;
  @Column({ type: 'text', nullable: true }) error?: string | null;
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' }) createdAt: Date;
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' }) updatedAt: Date;
}
