import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Country } from 'src/app-configuration/country/entity/country.entity';
import { Currency } from 'src/app-configuration/currency/entity/currency.entity';
import { Files } from 'src/files/entities/file.entity';
import { Buyer } from 'src/merchandising/buyer/entity/buyer.entity';
import { Style } from './entity/style.entity';
import { StyleController } from './style.controller';
import { StyleService } from './style.service';

@Module({
  imports: [TypeOrmModule.forFeature([Style, Buyer, Currency, Files, Country])],
  controllers: [StyleController],
  providers: [StyleService],
})
export class StyleModule {}
