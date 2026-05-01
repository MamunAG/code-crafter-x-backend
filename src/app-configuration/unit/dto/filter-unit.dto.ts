import { ApiProperty } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';
import { PaginationDto } from 'src/common/dto/pagination.dto';

export class FilterUnitDto extends PaginationDto {
  @ApiProperty({ description: 'UOM name', example: 'Kilogram', required: false })
  @IsOptional()
  name: string;

  @ApiProperty({ description: 'UOM short name', example: 'KG', required: false })
  @IsOptional()
  shortName: string;

  @ApiProperty({ description: 'Active status', example: 'Y', required: false })
  @IsOptional()
  isActive: string;
}
