import { ApiProperty } from '@nestjs/swagger';
import { Transform, type TransformFnParams } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';

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

  @ApiProperty({ description: 'Whether to fetch deleted items only', required: false, default: false })
  @Transform(({ value }: TransformFnParams): boolean | string => {
    if (value === true || value === 'true') {
      return true;
    }

    if (value === false || value === 'false') {
      return false;
    }

    return value;
  })
  @IsBoolean()
  @IsOptional()
  deletedOnly?: boolean;
}
