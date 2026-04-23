import { ApiProperty } from '@nestjs/swagger';
import { RolesEnum } from '../../common/enums/role.enum';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Files } from './../../files/entities/file.entity';
import { JoinColumn, ManyToOne } from 'typeorm';
import { LanguageEnum } from '../enum/language.enum';
import { Gender } from '../enum/gender.enum';
import { Status } from '../../common/enums';

@Entity('users')
export class User {
  @ApiProperty({ description: 'User ID' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  //first-screen
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
  //.

  //second-screen
  @ApiProperty({ description: 'User name', example: 'user@007' })
  @Column({ unique: true, nullable: false })
  user_name: string;
  //.

  //third-screen
  @ApiProperty({ description: 'User password', example: 'p@ssword' })
  @Column({ select: false })
  password: string;
  //.

  //fourth-screen
  @ApiProperty({ description: 'User profile pic id', example: 1, })
  @Column({ nullable: true })
  file_id: number;

  @ApiProperty({ description: 'User display name', example: 'My Name', required: true, })
  @Column({ nullable: false })
  display_name: string;

  @ApiProperty({ description: 'User bio', example: 'abc efg ijk', required: false, })
  @Column({ nullable: true })
  bio: string;
  //.

  @ApiProperty({ description: 'User role ID', example: 1, })
  @Column({ type: 'enum', enum: RolesEnum, nullable: false })
  role: RolesEnum;

  @ApiProperty({ description: 'User status', example: 'active', enum: Status, })
  @Column({ type: 'enum', enum: Status, nullable: false, default: Status.active, })
  status: Status;

  @ApiProperty()
  @Column({ type: 'timestamp', nullable: true })
  last_seen_at?: Date;

  @ApiProperty({ description: `Must be within ${Object.values(LanguageEnum).join(', ')}`, enum: LanguageEnum, example: LanguageEnum.English })
  @Column({ type: 'enum', enum: LanguageEnum, nullable: true, default: LanguageEnum.English })
  language: LanguageEnum;

  @ApiProperty()
  @Column({ type: 'boolean', default: false, nullable: false })
  is_delete_account: boolean;

  @ApiProperty({ description: 'account_delete_at', example: '2025-03-14T12:00:00.000Z', })
  @Column({ type: 'timestamp', nullable: true })
  account_delete_at: Date | null;

  //-----------------------------------------------
  @ApiProperty()
  @Column({ type: 'boolean', default: false, nullable: false })
  is_show_your_birth_date: boolean;

  @ApiProperty()
  @Column({ type: 'boolean', default: false, nullable: false })
  is_show_your_location_on_profile: boolean;

  @ApiProperty()
  @Column({ type: 'boolean', default: true, nullable: false })
  is_disable_private_chats: boolean;

  @ApiProperty()
  @Column({ type: 'boolean', default: true, nullable: false })
  is_enable_notifications: boolean;

  @ApiProperty()
  @Column({ type: 'boolean', default: false, nullable: false })
  is_Save_your_activity_on_this_device: boolean;

  @ApiProperty()
  @Column({ type: 'boolean', default: false, nullable: true })
  isSubscribedUser: boolean;

  @ApiProperty()
  @Column({ type: 'boolean', default: false, nullable: true })
  is_moderation_user: boolean;

  //-----------------------------------------------

  /*Relations */
  @ApiProperty({ description: 'File object', type: () => Files, })
  @ManyToOne(() => Files, { nullable: true })
  @JoinColumn({ name: 'file_id' })
  file: Files;

  //====================================================================

  @ApiProperty({ description: 'Created by user id', example: 'xxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', })
  @Column({ nullable: true })
  created_by: string;

  @ApiProperty({ description: 'User created at', example: '2025-03-14T12:00:00.000Z', })
  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @ApiProperty({ description: 'Updated by user id', example: 'xxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', })
  @Column({ nullable: true })
  updated_by: string;

  @ApiProperty({ description: 'User updated at', example: '2025-03-14T12:00:00.000Z', })
  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;

  @ApiProperty({ description: 'User deleted at', example: '2025-03-14T12:00:00.000Z', })
  @DeleteDateColumn({ type: 'timestamp' })
  deleted_at: Date;

}
