import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from 'src/common/entities/base.entity';
import { OrganizationAccessRequestStatusEnum } from 'src/common/enums/organization-access-request-status.enum';
import { User } from 'src/users/entities/user.entity';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('organization_access_requests')
@Index(
  'IDX_organization_access_requests_pending_admin_unique',
  ['requestedByUserId', 'requestedAdminUserId'],
  {
    unique: true,
    where: `"status" = 'pending'`,
  },
)
export class OrganizationAccessRequest extends BaseEntity {
  @ApiProperty({ description: 'Access request ID' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Requesting user ID' })
  @Column({ name: 'requested_by_user_id', type: 'uuid' })
  requestedByUserId: string;

  @ApiProperty({ description: 'Target admin user ID' })
  @Column({ name: 'requested_admin_user_id', type: 'uuid' })
  requestedAdminUserId: string;

  @ApiProperty({ description: 'Target admin email' })
  @Column({ name: 'requested_admin_email', type: 'varchar' })
  requestedAdminEmail: string;

  @ApiProperty({ description: 'Request message', required: false, nullable: true })
  @Column({ type: 'text', nullable: true })
  message?: string | null;

  @ApiProperty({ description: 'Request status', enum: OrganizationAccessRequestStatusEnum })
  @Column({
    type: 'enum',
    enum: OrganizationAccessRequestStatusEnum,
    default: OrganizationAccessRequestStatusEnum.pending,
  })
  status: OrganizationAccessRequestStatusEnum;

  @ApiProperty({ description: 'Reviewed by user ID', required: false, nullable: true })
  @Column({ name: 'reviewed_by_user_id', type: 'uuid', nullable: true })
  reviewedByUserId?: string | null;

  @ApiProperty({ description: 'Reviewed at', required: false, nullable: true })
  @Column({ name: 'reviewed_at', type: 'timestamp', nullable: true })
  reviewedAt?: Date | null;

  @ApiProperty({ description: 'Review note', required: false, nullable: true })
  @Column({ name: 'review_note', type: 'text', nullable: true })
  reviewNote?: string | null;

  @ApiProperty({ description: 'Requester', type: () => User })
  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'requested_by_user_id' })
  requestedByUser: User;

  @ApiProperty({ description: 'Target admin', type: () => User })
  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'requested_admin_user_id' })
  requestedAdminUser: User;

  @ApiProperty({ description: 'Reviewer', type: () => User, required: false, nullable: true })
  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'reviewed_by_user_id' })
  reviewedByUser?: User | null;
}
