import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional } from 'class-validator';
import { Color } from '../entity/color.entity';

export class CreateColorDto extends PartialType(Color) {
  @ApiProperty({ description: 'Color name', example: 'Blue' })
  @IsNotEmpty()
  color_name: string;

  @ApiProperty({ description: 'Color display name', example: 'Ocean Blue' })
  @IsOptional()
  color_display_name: string;

  @ApiProperty({ description: 'Color description', example: 'Deep blue shade used for denim.' })
  @IsOptional()
  color_description: string;
}
