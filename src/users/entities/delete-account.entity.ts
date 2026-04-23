import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('delete_account')
export class DeleteAccount {
  @ApiProperty({ description: 'User ID' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Created by user id', example: 'xxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', })
  @Column({ nullable: true })
  user_id: string;

  @Column({ type: 'boolean', default: false, nullable: false })
  is_irrelevant_content: boolean;

  @Column({ type: 'boolean', default: false, nullable: false })
  is_negative_community: boolean;

  @Column({ type: 'boolean', default: false, nullable: false })
  is_no_activity: boolean;

  @Column({ type: 'boolean', default: false, nullable: false })
  is_too_time_consuming: boolean;

  @Column({ type: 'boolean', default: false, nullable: false })
  is_other: boolean;

  //====================================================================

  @ApiProperty({ description: 'User created at', example: '2025-03-14T12:00:00.000Z', })
  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @ApiProperty({ description: 'User updated at', example: '2025-03-14T12:00:00.000Z', })
  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;

  @ApiProperty({ description: 'User deleted at', example: '2025-03-14T12:00:00.000Z', })
  @DeleteDateColumn({ type: 'timestamp' })
  deleted_at: Date;

  /*Relations */
  @ApiProperty({ description: 'User object', type: () => User, })
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
