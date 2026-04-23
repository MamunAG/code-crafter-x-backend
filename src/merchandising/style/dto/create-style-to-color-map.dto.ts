import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber } from 'class-validator';

export class CreateStyleToColorMapDto {
  @ApiProperty({ description: 'Color ID', example: 1 })
  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  colorId: number;
}
