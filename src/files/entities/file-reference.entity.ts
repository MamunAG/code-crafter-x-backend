import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { Files } from './file.entity';

@Entity('file_references')
export class FileReference {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'file_id' })
  file_id: number;

  @Column({ type: 'varchar', length: 50 })
  resource: string;

  @Column({ name: 'resource_id' })
  resource_id: number;

  @Column({ name: 'reference_type', type: 'varchar', length: 50 })
  reference_type: string;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;

  @ManyToOne(() => Files, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'file_id' })
  file: Files;
}
