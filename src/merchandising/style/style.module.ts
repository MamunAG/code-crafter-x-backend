import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Color } from 'src/merchandising/master-data/color/entity/color.entity';
import { Embellishment } from 'src/merchandising/master-data/embellishment/entity/embellishment.entity';
import { Size } from 'src/merchandising/master-data/size/entity/size.entity';
import { Country } from 'src/app-configuration/country/entity/country.entity';
import { Currency } from 'src/app-configuration/currency/entity/currency.entity';
import { Files } from 'src/files/entities/file.entity';
import { Buyer } from 'src/merchandising/buyer/entity/buyer.entity';
import { StyleToEmbellishmentMap } from './entity/style-to-embellishment-map.entity';
import { StyleToColorMap } from './entity/style-to-color-map.entity';
import { StyleToSizeMap } from './entity/style-to-size-map.entity';
import { Style } from './entity/style.entity';
import { StyleController } from './style.controller';
import { StyleService } from './style.service';

@Module({
  imports: [TypeOrmModule.forFeature([Style, StyleToColorMap, StyleToSizeMap, StyleToEmbellishmentMap, Buyer, Currency, Files, Color, Size, Embellishment, Country])],
  controllers: [StyleController],
  providers: [StyleService],
})
export class StyleModule {}

