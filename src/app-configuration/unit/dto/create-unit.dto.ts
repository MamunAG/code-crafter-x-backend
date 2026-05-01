import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty } from 'class-validator';
import { Unit } from '../entity/unit.entity';

export class CreateUnitDto extends PartialType(Unit) {
  @ApiProperty({ description: 'UOM name', example: 'Kilogram' })
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'UOM short name', example: 'KG' })
  @IsNotEmpty()
  shortName: string;

  @ApiProperty({ description: 'Active status', example: true })
  @IsBoolean()
  isActive: boolean = true;
}
