import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Buyer } from '../buyer/entity/buyer.entity';
import { Job } from '../job/entity/job.entity';
import { TnaTask } from '../master-data/tna-task/entity/tna-task.entity';
import { TnaDetailRevision } from './entity/tna-detail-revision.entity';
import { TnaDetail } from './entity/tna-details.entity';
import { Tna } from './entity/tna.entity';
import { TnaController } from './tna.controller';
import { TnaService } from './tna.service';

@Module({
  imports: [TypeOrmModule.forFeature([Tna, TnaDetail, TnaDetailRevision, Buyer, Job, TnaTask])],
  controllers: [TnaController],
  providers: [TnaService],
})
export class TnaModule {}
