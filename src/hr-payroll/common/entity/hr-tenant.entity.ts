import { Column, CreateDateColumn, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn, VersionColumn } from 'typeorm';
import { Organization } from 'src/app-configuration/organization/entity/organization.entity';

export abstract class HrTenantEntity {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Index() @Column({ name: 'organization_id', type: 'uuid' }) organizationId: string;
  @ManyToOne(() => Organization, { nullable: false }) @JoinColumn({ name: 'organization_id' }) organization: Organization;
  @Column({ name: 'created_by_id', type: 'uuid', nullable: true }) createdById?: string | null;
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' }) createdAt: Date;
  @Column({ name: 'updated_by_id', type: 'uuid', nullable: true }) updatedById?: string | null;
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' }) updatedAt: Date;
  @VersionColumn({ name: 'row_version' }) rowVersion: number;
}
