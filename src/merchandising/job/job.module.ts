import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Factory } from 'src/app-configuration/factory/entity/factory.entity';
import { Buyer } from 'src/merchandising/buyer/entity/buyer.entity';
import { Color } from 'src/merchandising/master-data/color/entity/color.entity';
import { Size } from 'src/merchandising/master-data/size/entity/size.entity';
import { Style } from 'src/merchandising/style/entity/style.entity';
import { JobDetails } from './entity/job-details.entity';
import { Job } from './entity/job.entity';
import { PurchaseOrder } from './entity/purchase-order.entity';
import { JobController } from './job.controller';
import { JobService } from './job.service';

@Module({
  imports: [TypeOrmModule.forFeature([Job, JobDetails, PurchaseOrder, Factory, Buyer, Style, Size, Color])],
  controllers: [JobController],
  providers: [JobService],
})
export class JobModule {}
