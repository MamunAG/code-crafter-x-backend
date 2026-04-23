import { ApiProperty } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';
import { PaginationDto } from 'src/common/dto/pagination.dto';

export class FilterCountryDto extends PaginationDto {
  @ApiProperty({ description: 'Country name', example: 'Bangladesh', required: false })
  @IsOptional()
  name: string;
}
