import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';
import { Country } from '../entity/country.entity';

export class CreateCountryDto extends PartialType(Country) {
  @ApiProperty({ description: 'Country name', example: 'Bangladesh' })
  @IsNotEmpty()
  name: string;
}
