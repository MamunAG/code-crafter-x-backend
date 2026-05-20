import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { Currency } from './entity/currency.entity';
import { CurrencyExchangeRate } from './entity/currency-exchange-rate.entity';
import { CurrencyController } from './currency.controller';
import { CurrencyService } from './currency.service';

@Module({
  imports: [HttpModule, TypeOrmModule.forFeature([Currency, CurrencyExchangeRate])],
  controllers: [CurrencyController],
  providers: [CurrencyService],
})
export class CurrencyModule {}
