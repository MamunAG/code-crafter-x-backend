import { ApiProperty } from '@nestjs/swagger';
import { RolesEnum } from '../../common/enums/role.enum';
import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Files } from './../../files/entities/file.entity';
import { JoinColumn, ManyToOne } from 'typeorm';
import { Gender } from '../enum/gender.enum';
import { Status } from '../../common/enums';
import { BaseEntity } from '../../common/entities/base.entity';

@Entity('users')
export class User extends BaseEntity {
  @ApiProperty({ description: 'User ID' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'User name', example: 'johndoe' })
  @Column({ unique: false, nullable: false })
  name: string;

  @ApiProperty({ description: 'User email', example: 'user@example.com' })
  @Column({ unique: true, nullable: false })
  email: string;

  @ApiProperty({ description: 'User phone number', example: '+880', required: false, })
  @Column({ nullable: false })
  phone_no: string;

  @ApiProperty({ description: 'Date of birth', example: '2025-03-14T12:00:00.000Z', })
  @Column({ type: 'timestamp' })
  date_of_birth: Date;

  @ApiProperty({ description: `Gender must be within ${Object.values(Gender).join(', ')}`, enum: Gender, example: Gender.male })
  @Column({ type: 'enum', enum: Gender, nullable: false })
  gender: Gender;

  @ApiProperty({ description: 'User name', example: 'user@007' })
  @Column({ unique: true, nullable: false })
  user_name: string;

  @ApiProperty({ description: 'User password', example: 'p@ssword' })
  @Column({ select: false })
  password: string;

  @ApiProperty({ description: 'User profile pic id', example: 1, })
  @Column({ nullable: true })
  profile_pic_id: number;

  @ApiProperty({ description: 'User bio', example: 'abc efg ijk', required: false, })
  @Column({ nullable: true })
  bio: string;

  @ApiProperty({ description: 'User role ID', example: 1, })
  @Column({ type: 'enum', enum: RolesEnum, nullable: false })
  role: RolesEnum;

  @ApiProperty({ description: 'User status', example: 'active', enum: Status, })
  @Column({ type: 'enum', enum: Status, nullable: false, default: Status.inactive, })
  status: Status;

  @ApiProperty()
  @Column({ type: 'timestamp', nullable: true })
  last_seen_at?: Date;

  @ApiProperty()
  @Column({ type: 'boolean', default: true, nullable: false })
  is_enable_notifications: boolean;

  @ApiProperty()
  @Column({ type: 'boolean', default: false, nullable: false })
  is_email_verified: boolean;

  /*Relations */
  @ApiProperty({ description: 'File object', type: () => Files, })
  @ManyToOne(() => Files, { nullable: true })
  @JoinColumn({ name: 'profile_pic_id' })
  profile_pic: Files;

}
