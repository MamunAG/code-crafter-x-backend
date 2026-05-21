import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';
import { PaginationDto } from 'src/common/dto/pagination.dto';

export class FilterOrderPlacementDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Buyer ID' })
  @IsOptional()
  @IsUUID()
  buyerId?: string;

  @ApiPropertyOptional({ description: 'Job ID' })
  @IsOptional()
  @IsUUID()
  jobId?: string;

  @ApiPropertyOptional({ description: 'Currency ID' })
  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  currencyId?: number;

  @ApiPropertyOptional({ description: 'Factory supplier ID' })
  @IsOptional()
  @IsUUID()
  factoryId?: string;

  @ApiPropertyOptional({ description: 'Placement date', example: '2026-05-21' })
  @IsOptional()
  @IsDateString()
  placementDate?: string;

  @ApiPropertyOptional({ description: 'Placed status', example: 'true' })
  @IsOptional()
  @IsString()
  isPlaced?: string;

  @ApiPropertyOptional({ description: 'Purchase order number search text' })
  @IsOptional()
  @IsString()
  pono?: string;

  @ApiPropertyOptional({ description: 'Return only soft deleted order placements', example: 'true' })
  @IsOptional()
  deletedOnly?: string | boolean;
}
