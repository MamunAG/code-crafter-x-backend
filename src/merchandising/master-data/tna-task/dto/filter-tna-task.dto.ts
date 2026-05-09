import { ApiProperty } from '@nestjs/swagger';
import { Transform, type TransformFnParams } from 'class-transformer';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

import { PaginationDto } from 'src/common/dto/pagination.dto';

export class FilterTnaTaskDto extends PaginationDto {
  @ApiProperty({ description: 'TNA task name', example: 'Pattern Making', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ description: 'Active status', example: 'true', required: false })
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
  isActive?: boolean | string;

  @ApiProperty({ description: 'Return only soft deleted tasks', required: false, default: false })
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
  deletedOnly?: boolean | string;
}
