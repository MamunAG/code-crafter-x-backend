import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Currency } from 'src/app-configuration/currency/entity/currency.entity';
import { Supplier } from 'src/app-configuration/supplier/entity/supplier.entity';
import { Buyer } from 'src/merchandising/buyer/entity/buyer.entity';
import { JobDetails } from 'src/merchandising/job/entity/job-details.entity';
import { Job } from 'src/merchandising/job/entity/job.entity';
import { PurchaseOrder } from 'src/merchandising/job/entity/purchase-order.entity';
import { Color } from 'src/merchandising/master-data/color/entity/color.entity';
import { Size } from 'src/merchandising/master-data/size/entity/size.entity';
import { Style } from 'src/merchandising/style/entity/style.entity';
import { OrderPlacementDetails } from './entity/order-placement-details.entity';
import { OrderPlacement } from './entity/order-placement.entity';
import { OrderPlacementController } from './order-placement.controller';
import { OrderPlacementService } from './order-placement.service';

@Module({
  imports: [TypeOrmModule.forFeature([OrderPlacement, OrderPlacementDetails, Buyer, Job, Currency, Supplier, JobDetails, PurchaseOrder, Style, Size, Color])],
  controllers: [OrderPlacementController],
  providers: [OrderPlacementService],
})
export class OrderPlacementModule {}
