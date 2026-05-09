import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from 'src/common/entities/base.entity';
import { Buyer } from 'src/merchandising/buyer/entity/buyer.entity';
import { Job } from 'src/merchandising/job/entity/job.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { TnaDetail } from './tna-details.entity';

@Entity('tna')
export class Tna extends BaseEntity {
  @ApiProperty({ description: 'Primary ID' })
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id: string;

  @ApiProperty({ description: 'Buyer ID', example: '8bf7d37e-4a62-47b1-b1e5-ded54c3cfb1f' })
  @Column({ name: 'buyer_id', type: 'uuid', nullable: false })
  buyerId: string;

  @ApiProperty({ description: 'Job ID', example: '8bf7d37e-4a62-47b1-b1e5-ded54c3cfb1f' })
  @Column({ name: 'job_id', type: 'uuid', nullable: false })
  jobId: string;

  @ApiProperty({ description: 'Lead time', example: 30 })
  @Column({ name: 'lead_time', type: 'integer', nullable: false })
  leadTime: number;

  @ApiProperty({ description: 'Buyer object', type: () => Buyer })
  @ManyToOne(() => Buyer, { nullable: false })
  @JoinColumn({ name: 'buyer_id' })
  buyer: Buyer;

  @ApiProperty({ description: 'Job object', type: () => Job })
  @ManyToOne(() => Job, { nullable: false })
  @JoinColumn({ name: 'job_id' })
  job: Job;

  @ApiProperty({ description: 'TNA details', type: () => [TnaDetail], required: false })
  @OneToMany(() => TnaDetail, (detail) => detail.tna)
  tnaDetails?: TnaDetail[];
}
