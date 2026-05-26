import { ApiProperty } from '@nestjs/swagger';
import { Transform, type TransformFnParams } from 'class-transformer';
import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from 'src/common/dto/pagination.dto';

export class FilterFabricProcessDto extends PaginationDto {
  @ApiProperty({ description: 'Fabric process name', example: 'Dyeing', required: false })
  @IsOptional()
  @IsString()
  name: string;

  @ApiProperty({ description: 'Active status', example: true, required: false })
  @IsOptional()
  @IsString()
  isActive?: string;

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
