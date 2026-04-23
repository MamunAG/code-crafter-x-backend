import { ApiProperty } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';

import { PaginationDto } from 'src/common/dto/pagination.dto';

export class FilterColorDto extends PaginationDto {
  @ApiProperty({ description: 'Color name', example: 'Blue', required: false })
  @IsOptional()
  colorName: string;

  @ApiProperty({ description: 'Color display name', example: 'Ocean Blue', required: false })
  @IsOptional()
  colorDisplayName: string;

  @ApiProperty({ description: 'Color description', example: 'Deep blue shade used for denim.', required: false })
  @IsOptional()
  colorDescription: string;
}
