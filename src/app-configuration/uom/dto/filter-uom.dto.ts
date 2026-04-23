import { ApiProperty } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';
import { PaginationDto } from 'src/common/dto/pagination.dto';

export class FilterUomDto extends PaginationDto {
  @ApiProperty({ description: 'UOM name', example: 'Kilogram', required: false })
  @IsOptional()
  name: string;

  @ApiProperty({ description: 'UOM short name', example: 'KG', required: false })
  @IsOptional()
  short_name: string;

  @ApiProperty({ description: 'Active status', example: 'Y', required: false })
  @IsOptional()
  is_active: string;
}
