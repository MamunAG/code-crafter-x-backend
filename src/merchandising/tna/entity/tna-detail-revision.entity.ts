import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BaseEntity } from 'src/common/entities/base.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { TnaDetail } from './tna-details.entity';

@Entity('tna_detail_revisions')
export class TnaDetailRevision extends BaseEntity {
  @ApiProperty({ description: 'Primary ID' })
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id: string;

  @ApiProperty({ description: 'TNA detail ID', example: '8bf7d37e-4a62-47b1-b1e5-ded54c3cfb1f' })
  @Column({ name: 'tna_detail_id', type: 'uuid', nullable: false })
  tnaDetailId: string;

  @ApiProperty({ description: 'Execution date before revision', example: '2026-05-05' })
  @Column({ name: 'previous_execution_date', type: 'date', nullable: false })
  previousExecutionDate: Date;

  @ApiProperty({ description: 'Execution date after revision', example: '2026-05-08' })
  @Column({ name: 'new_execution_date', type: 'date', nullable: false })
  newExecutionDate: Date;

  @ApiPropertyOptional({ description: 'Revision note', example: 'Fabric approval was delayed.' })
  @Column({ name: 'note', type: 'text', nullable: true })
  note?: string | null;

  @ApiProperty({ description: 'TNA detail object', type: () => TnaDetail })
  @ManyToOne(() => TnaDetail, (detail) => detail.revisions, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tna_detail_id' })
  tnaDetail: TnaDetail;
}
