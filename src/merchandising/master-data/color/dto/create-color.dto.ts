import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, Matches } from 'class-validator';
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

  @ApiProperty({ description: 'Hex color code', example: '#1E88E5', required: false, nullable: true })
  @IsOptional()
  @Matches(/^#?[0-9A-Fa-f]{6}$/, {
    message: 'Hex color code must be a valid 6-digit hex value',
  })
  colorHexCode?: string | null;
}
