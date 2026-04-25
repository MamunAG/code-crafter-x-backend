import { ApiProperty } from '@nestjs/swagger';
import { Transform, type TransformFnParams } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';
import { PaginationDto } from 'src/common/dto/pagination.dto';

export class FilterSizeDto extends PaginationDto {
  @ApiProperty({ description: 'Size name', example: 'M', required: false })
  @IsOptional()
  sizeName: string;

  @ApiProperty({ description: 'Deleted only', required: false, default: false })
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
