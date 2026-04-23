import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber } from 'class-validator';

export class CreateStyleToSizeMapDto {
  @ApiProperty({ description: 'Size ID', example: 1 })
  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  sizeId: number;
}
