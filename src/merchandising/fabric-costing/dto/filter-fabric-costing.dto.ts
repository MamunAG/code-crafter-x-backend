import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type, Transform, type TransformFnParams } from 'class-transformer';
import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from 'src/common/dto/pagination.dto';

export class FilterFabricCostingDto extends PaginationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  styleId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  fabricId?: string;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  currencyId?: number;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  unitId?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  costName?: string;

  @ApiPropertyOptional({ default: false })
  @Transform(({ value }: TransformFnParams): boolean | string => {
    if (value === true || value === 'true') return true;
    if (value === false || value === 'false') return false;
    return value;
  })
  @IsBoolean()
  @IsOptional()
  deletedOnly?: boolean | string;
}
