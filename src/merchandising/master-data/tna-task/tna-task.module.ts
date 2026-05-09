import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { TnaTask } from './entity/tna-task.entity';
import { TnaTaskController } from './tna-task.controller';
import { TnaTaskService } from './tna-task.service';

@Module({
  imports: [TypeOrmModule.forFeature([TnaTask])],
  controllers: [TnaTaskController],
  providers: [TnaTaskService],
})
export class TnaTaskModule {}
