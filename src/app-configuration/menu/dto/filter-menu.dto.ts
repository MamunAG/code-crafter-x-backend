import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { PaginationDto } from 'src/common/dto/pagination.dto';

function toBoolean(value: unknown) {
  if (value === 'true' || value === true) return true;
  if (value === 'false' || value === false) return false;
  return value;
}

export class FilterMenuDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Menu name search' })
  @IsOptional()
  @IsString()
  menuName?: string;

  @ApiPropertyOptional({ description: 'Menu path search' })
  @IsOptional()
  @IsString()
  menuPath?: string;

  @ApiPropertyOptional({ description: 'Active status filter' })
  @IsOptional()
  @Transform(({ value }) => toBoolean(value))
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;
}
