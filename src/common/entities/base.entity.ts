import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  JoinColumn,
  ManyToOne,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export abstract class BaseEntity {
  @ApiProperty({ description: 'Created by user id', example: 'xxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx' })
  @Column({ nullable: true })
  created_by_id: string;

  @ApiProperty({ description: 'Created at', example: '2025-03-14T12:00:00.000Z' })
  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @ApiProperty({ description: 'Updated by user id', example: 'xxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx' })
  @Column({ nullable: true })
  updated_by_id: string;

  @ApiProperty({ description: 'Updated at', example: '2025-03-14T12:00:00.000Z' })
  @UpdateDateColumn({ type: 'timestamp', nullable: true })
  updated_at: Date;

  @ApiProperty({ description: 'Deleted at', example: '2025-03-14T12:00:00.000Z' })
  @DeleteDateColumn({ type: 'timestamp', nullable: true })
  deleted_at: Date;

  @ApiProperty({ description: 'Deleted by user id', required: false, nullable: true })
  @Column({ nullable: true })
  deleted_by_id?: string | null;

  @ApiProperty({ description: 'User object', type: () => User })
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'created_by_id' })
  created_by_user: User;

  @ApiProperty({ description: 'User object', type: () => User })
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'updated_by_id' })
  updated_by_user: User;

  @ApiProperty({ description: 'User object', type: () => User, required: false, nullable: true })
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'deleted_by_id' })
  deleted_by_user?: User | null;
}
