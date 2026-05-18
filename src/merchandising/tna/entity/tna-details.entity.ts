import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BaseEntity } from 'src/common/entities/base.entity';
import { TnaTask } from 'src/merchandising/master-data/tna-task/entity/tna-task.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { TnaDetailRevision } from './tna-detail-revision.entity';
import { Tna } from './tna.entity';

@Entity('tna_details')
export class TnaDetail extends BaseEntity {
  @ApiProperty({ description: 'Primary ID' })
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id: string;

  @ApiProperty({ description: 'TNA ID', example: '8bf7d37e-4a62-47b1-b1e5-ded54c3cfb1f' })
  @Column({ name: 'tna_id', type: 'uuid', nullable: false })
  tnaId: string;

  @ApiProperty({ description: 'TNA task ID', example: '8bf7d37e-4a62-47b1-b1e5-ded54c3cfb1f' })
  @Column({ name: 'task_id', type: 'uuid', nullable: false })
  taskId: string;

  @ApiProperty({ description: 'Execution date', example: '2026-05-05' })
  @Column({ name: 'execution_date', type: 'date', nullable: false })
  executionDate: Date;

  @ApiProperty({ description: 'Days', example: 7 })
  @Column({ name: 'days', type: 'integer', nullable: false })
  days: number;

  @ApiProperty({ description: 'Saved row sort order', example: 1 })
  @Column({ name: 'sort_order', type: 'integer', nullable: false, default: 0 })
  sortOrder: number;

  @ApiPropertyOptional({ description: 'Relation formula', example: 'lead_time - 7' })
  @Column({ name: 'relation_formula', type: 'text', nullable: true })
  relationFormula?: string | null;

  @ApiProperty({ description: 'TNA object', type: () => Tna })
  @ManyToOne(() => Tna, (tna) => tna.tnaDetails, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tna_id' })
  tna: Tna;

  @ApiProperty({ description: 'TNA task object', type: () => TnaTask })
  @ManyToOne(() => TnaTask, { nullable: false })
  @JoinColumn({ name: 'task_id' })
  task: TnaTask;

  @ApiProperty({ description: 'TNA detail revisions', type: () => [TnaDetailRevision], required: false })
  @OneToMany(() => TnaDetailRevision, (revision) => revision.tnaDetail)
  revisions?: TnaDetailRevision[];
}
