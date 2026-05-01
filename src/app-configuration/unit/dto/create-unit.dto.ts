import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional } from 'class-validator';
import { Unit } from '../entity/unit.entity';

export class CreateUnitDto extends PartialType(Unit) {
  @ApiProperty({ description: 'UOM name', example: 'Kilogram' })
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'UOM short name', example: 'KG' })
  @IsNotEmpty()
  shortName: string;

  @ApiProperty({ description: 'Active status', example: 'Y' })
  @IsOptional()
  isActive: string;
}
