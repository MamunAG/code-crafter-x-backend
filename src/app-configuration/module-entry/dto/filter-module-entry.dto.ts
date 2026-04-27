import { Transform, Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from 'src/common/dto/pagination.dto';

function toBoolean(value: unknown) {
  if (value === 'true' || value === true) return true;
  if (value === 'false' || value === false) return false;
  return value;
}

export class FilterModuleEntryDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Module name search' })
  @IsOptional()
  @IsString()
  moduleName?: string;

  @ApiPropertyOptional({ description: 'Module key search' })
  @IsOptional()
  @IsString()
  moduleKey?: string;

  @ApiPropertyOptional({ description: 'Active status filter' })
  @IsOptional()
  @Transform(({ value }) => toBoolean(value))
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;
}
