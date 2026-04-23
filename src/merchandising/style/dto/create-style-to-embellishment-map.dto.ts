import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber } from 'class-validator';

export class CreateStyleToEmbellishmentMapDto {
  @ApiProperty({ description: 'Embellishment ID', example: 1 })
  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  embellishmentId: number;
}
