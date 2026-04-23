import { ApiProperty } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';
import { PaginationDto } from 'src/common/dto/pagination.dto';

export class FilterSizeDto extends PaginationDto {
  @ApiProperty({ description: 'Size name', example: 'M', required: false })
  @IsOptional()
  sizeName: string;
}
