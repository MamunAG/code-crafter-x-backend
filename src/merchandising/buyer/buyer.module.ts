import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Country } from 'src/app-configuration/country/entity/country.entity';
import { Buyer } from './entity/buyer.entity';
import { BuyerController } from './buyer.controller';
import { BuyerService } from './buyer.service';

@Module({
  imports: [TypeOrmModule.forFeature([Buyer, Country])],
  controllers: [BuyerController],
  providers: [BuyerService],
})
export class BuyerModule {}
