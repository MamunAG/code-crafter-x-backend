import { ApiProperty } from '@nestjs/swagger';
import { Transform, type TransformFnParams } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';

import { PaginationDto } from 'src/common/dto/pagination.dto';

export class FilterOrganizationDto extends PaginationDto {
  @ApiProperty({ description: 'Organization name', example: 'Code Crafter X', required: false })
  @IsOptional()
  name: string;

  @ApiProperty({ description: 'Organization address', example: '123 Main Street, Dhaka', required: false })
  @IsOptional()
  address: string;

  @ApiProperty({ description: 'Organization contact', example: '+8801712345678', required: false })
  @IsOptional()
  contact: string;

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
