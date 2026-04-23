import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional } from 'class-validator';
import { Color } from '../entity/color.entity';

export class CreateColorDto extends PartialType(Color) {
  @ApiProperty({ description: 'Color name', example: 'Blue' })
  @IsNotEmpty()
  colorName: string;

  @ApiProperty({ description: 'Color display name', example: 'Ocean Blue' })
  @IsOptional()
  colorDisplayName: string;

  @ApiProperty({ description: 'Color description', example: 'Deep blue shade used for denim.' })
  @IsOptional()
  colorDescription: string;
}
