import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional } from 'class-validator';
import { Uom } from '../entity/uom.entity';

export class CreateUomDto extends PartialType(Uom) {
  @ApiProperty({ description: 'UOM name', example: 'Kilogram' })
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'UOM short name', example: 'KG' })
  @IsNotEmpty()
  short_name: string;

  @ApiProperty({ description: 'Active status', example: 'Y' })
  @IsOptional()
  is_active: string;
}
