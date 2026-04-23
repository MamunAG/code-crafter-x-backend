import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { Currency } from '../entity/currency.entity';

export class CreateCurrencyDto extends PartialType(Currency) {
  @ApiProperty({ description: 'Currency name', example: 'Bangladeshi Taka' })
  @IsString()
  @IsNotEmpty()
  currencyName: string;

  @ApiProperty({ description: 'Currency code', example: 'BDT' })
  @IsString()
  @IsNotEmpty()
  currencyCode: string;

  @ApiProperty({ description: 'Exchange rate', example: 1.0 })
  @IsNumber()
  rate: number;

  @ApiProperty({ description: 'Currency symbol', example: 'BDT' })
  @IsString()
  @IsNotEmpty()
  symbol: string;

  @ApiProperty({ description: 'Default currency flag', example: false })
  @IsBoolean()
  isDefault: boolean;

  @ApiProperty({ description: 'Active status', example: true })
  @IsBoolean()
  isActive: boolean;
}
