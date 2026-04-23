import { ApiProperty } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';

import { PaginationDto } from 'src/common/dto/pagination.dto';

export class FilterColorDto extends PaginationDto {
  @ApiProperty({ description: 'Color name', example: 'Blue', required: false })
  @IsOptional()
  color_name: string;

  @ApiProperty({ description: 'Color display name', example: 'Ocean Blue', required: false })
  @IsOptional()
  color_display_name: string;

  @ApiProperty({ description: 'Color description', example: 'Deep blue shade used for denim.', required: false })
  @IsOptional()
  color_description: string;
}
