import { ApiProperty } from '@nestjs/swagger';
import { User } from 'src/users/entities/user.entity';
import { BaseEntity } from 'src/common/entities/base.entity';
import { NotificationTypeEnum } from 'src/common/enums/notification-type.enum';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('notifications')
@Index('IDX_notifications_user_read', ['userId', 'isRead'])
export class Notification extends BaseEntity {
  @ApiProperty({ description: 'Notification ID' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Target user ID' })
  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ApiProperty({ description: 'Notification title' })
  @Column({ type: 'varchar' })
  title: string;

  @ApiProperty({ description: 'Notification body' })
  @Column({ type: 'text' })
  body: string;

  @ApiProperty({ description: 'Notification link', required: false, nullable: true })
  @Column({ type: 'varchar', nullable: true })
  link?: string | null;

  @ApiProperty({ description: 'Notification type', enum: NotificationTypeEnum })
  @Column({ type: 'enum', enum: NotificationTypeEnum, default: NotificationTypeEnum.organization_access_request })
  type: NotificationTypeEnum;

  @ApiProperty({ description: 'Whether the notification is read' })
  @Column({ name: 'is_read', type: 'boolean', default: false })
  isRead: boolean;

  @ApiProperty({ description: 'When the notification was read', required: false, nullable: true })
  @Column({ name: 'read_at', type: 'timestamp', nullable: true })
  readAt?: Date | null;

  @ApiProperty({ description: 'Notification metadata', required: false, nullable: true })
  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown> | null;

  @ApiProperty({ description: 'Target user', type: () => User })
  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
