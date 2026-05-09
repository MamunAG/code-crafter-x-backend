import { ApiProperty } from '@nestjs/swagger';
import { Transform, type TransformFnParams } from 'class-transformer';
import { IsBoolean, IsOptional, IsUUID } from 'class-validator';
import { PaginationDto } from 'src/common/dto/pagination.dto';

export class FilterTnaDto extends PaginationDto {
  @ApiProperty({ description: 'Buyer ID', required: false })
  @IsOptional()
  @IsUUID()
  buyerId?: string;

  @ApiProperty({ description: 'Job ID', required: false })
  @IsOptional()
  @IsUUID()
  jobId?: string;

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
  deletedOnly?: boolean | string;
}
