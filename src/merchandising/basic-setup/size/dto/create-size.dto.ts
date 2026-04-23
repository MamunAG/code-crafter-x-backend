import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';
import { Size } from '../entity/size.entity';

export class CreateSizeDto extends PartialType(Size) {
  @ApiProperty({ description: 'Size name', example: 'M' })
  @IsNotEmpty()
  sizeName: string;
}
