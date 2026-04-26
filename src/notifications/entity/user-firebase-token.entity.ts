import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from 'src/common/entities/base.entity';
import { User } from 'src/users/entities/user.entity';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('user_firebase_tokens')
@Index('IDX_user_firebase_tokens_user', ['userId'])
@Index('UQ_user_firebase_tokens_token', ['token'], { unique: true })
export class UserFirebaseToken extends BaseEntity {
  @ApiProperty({ description: 'Firebase token record ID' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'User ID that owns this Firebase token' })
  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ApiProperty({ description: 'Firebase Cloud Messaging token' })
  @Column({ type: 'text' })
  token: string;

  @ApiProperty({ description: 'Client platform', required: false, nullable: true })
  @Column({ type: 'varchar', nullable: true })
  platform?: string | null;

  @ApiProperty({ description: 'Client user agent', required: false, nullable: true })
  @Column({ name: 'user_agent', type: 'text', nullable: true })
  userAgent?: string | null;

  @ApiProperty({ description: 'Last time the token was registered or refreshed' })
  @Column({ name: 'last_seen_at', type: 'timestamp', default: () => 'now()' })
  lastSeenAt: Date;

  @ApiProperty({ description: 'Token owner', type: () => User })
  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
