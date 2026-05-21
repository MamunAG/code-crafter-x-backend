import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class CreateOrderPlacementDetailDto {
  @ApiPropertyOptional({ description: 'Existing order placement detail ID when updating', example: '8bf7d37e-4a62-47b1-b1e5-ded54c3cfb1f' })
  @IsOptional()
  @IsUUID()
  id?: string;

  @ApiPropertyOptional({ description: 'Source job detail ID', example: '8bf7d37e-4a62-47b1-b1e5-ded54c3cfb1f' })
  @IsOptional()
  @IsUUID()
  jobDetailId?: string | null;

  @ApiPropertyOptional({ description: 'Job ID', example: '8bf7d37e-4a62-47b1-b1e5-ded54c3cfb1f' })
  @IsOptional()
  @IsUUID()
  jobId?: string;

  @ApiPropertyOptional({ description: 'Purchase order ID', example: '8bf7d37e-4a62-47b1-b1e5-ded54c3cfb1f' })
  @IsOptional()
  @IsUUID()
  poId?: string;

  @ApiPropertyOptional({ description: 'Style ID', example: '8bf7d37e-4a62-47b1-b1e5-ded54c3cfb1f' })
  @IsOptional()
  @IsUUID()
  styleId?: string;

  @ApiPropertyOptional({ description: 'Size ID', example: 1 })
  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  sizeId?: number;

  @ApiPropertyOptional({ description: 'Color ID', example: 1 })
  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  colorId?: number;

  @ApiPropertyOptional({ description: 'Quantity', example: 1000 })
  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @Min(0)
  quantity?: number;

  @ApiPropertyOptional({ description: 'FOB', example: 5.25 })
  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @Min(0)
  fob?: number;

  @ApiPropertyOptional({ description: 'CM/Dzn', example: 1.25 })
  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @Min(0)
  cm?: number;

  @ApiPropertyOptional({ description: 'Delivery date', example: '2026-05-05' })
  @IsOptional()
  @IsDateString()
  deliveryDate?: string | null;

  @ApiPropertyOptional({ description: 'Cutting limit percentage', example: 3 })
  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @Min(0)
  cuttingLimitPercentage?: number | null;

  @ApiPropertyOptional({ description: 'Remarks', example: 'First shipment' })
  @IsOptional()
  @IsString()
  remarks?: string | null;

  @ApiPropertyOptional({ description: 'Factory CM/Dzn', example: 1.15 })
  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @Min(0)
  factoryCm?: number | null;

  @ApiPropertyOptional({ description: 'Factory FOB', example: 5 })
  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @Min(0)
  factoryFob?: number | null;

  @ApiPropertyOptional({ description: 'Factory shipment date', example: '2026-06-30' })
  @IsOptional()
  @IsDateString()
  factoryShipmentDate?: string | null;

  @ApiPropertyOptional({ description: 'Total factory CM', example: 95.83 })
  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @Min(0)
  totalFactoryCm?: number | null;

  @ApiPropertyOptional({ description: 'Total factory FOB', example: 5000 })
  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @Min(0)
  totalFactoryFob?: number | null;
}
