import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsDateString, IsNumber, IsOptional, IsUUID, ValidateNested } from 'class-validator';
import { CreateOrderPlacementDetailDto } from './create-order-placement-detail.dto';

export class CreateOrderPlacementDto {
  @ApiProperty({ description: 'Buyer ID', example: '8bf7d37e-4a62-47b1-b1e5-ded54c3cfb1f' })
  @IsUUID()
  buyerId: string;

  @ApiProperty({ description: 'Job ID', example: '8bf7d37e-4a62-47b1-b1e5-ded54c3cfb1f' })
  @IsUUID()
  jobId: string;

  @ApiProperty({ description: 'Currency ID', example: 1 })
  @Type(() => Number)
  @IsNumber()
  currencyId: number;

  @ApiProperty({ description: 'Placement date', example: '2026-05-21' })
  @IsDateString()
  placementDate: string;

  @ApiPropertyOptional({ description: 'Exchange rate BDT', example: 120.5 })
  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  exchangeRateBDT?: number | null;

  @ApiProperty({ description: 'Factory supplier ID', example: '8bf7d37e-4a62-47b1-b1e5-ded54c3cfb1f' })
  @IsUUID()
  factoryId: string;

  @ApiPropertyOptional({ description: 'Placed status', example: true })
  @IsOptional()
  @IsBoolean()
  isPlaced?: boolean;

  @ApiPropertyOptional({ description: 'Order placement detail rows', type: () => [CreateOrderPlacementDetailDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderPlacementDetailDto)
  orderPlacementDetails?: CreateOrderPlacementDetailDto[];
}
