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

import { User } from '../../users/entities/user.entity';

export enum FileType {
  DOCUMENT = 'document',
  RECEIPT = 'receipt',
  PHOTO = 'photo',
  VIDEO = 'video',
  AUDIO = 'audio',
  OTHER = 'other',
  IMAGE = "image",
}

export enum FileCategory {
  PERSONAL = 'personal',
  FINANCIAL = 'financial',
  MEDICAL = 'medical',
  ADMINISTRATIVE = 'administrative',
  OTHER = 'other',
}

@Entity('files')
export class Files {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  file_name: string;

  @Column({ name: 'original_name', type: 'varchar', length: 255 })
  original_name: string;

  @Column({ name: 'file_path', type: 'varchar', length: 500 })
  file_path: string;

  @Column({ name: 'file_size', type: 'bigint' })
  file_size?: number;

  @Column({ name: 'mime_type', type: 'varchar', length: 100 })
  mime_type: string;

  @Column({
    type: 'enum',
    enum: FileType,
    default: FileType.OTHER,
  })
  file_type: FileType;

  @Column({
    type: 'enum',
    enum: FileCategory,
    default: FileCategory.OTHER,
  })
  file_category: FileCategory;

  @Column({ name: 'uploaded_by', nullable: true })
  uploaded_by: string;

  @CreateDateColumn({ name: 'uploaded_at' })
  uploaded_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @DeleteDateColumn({ type: 'timestamp' })
  deleted_at: Date;

  @Column({ name: 'public_url', type: 'varchar', nullable: true })
  public_url: string;

  // Relations
  @ManyToOne(() => User, { onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'uploaded_by' })
  uploadedBy: User;
}
