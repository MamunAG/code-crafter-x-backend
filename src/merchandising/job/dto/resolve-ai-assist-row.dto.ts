import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class ResolveAiAssistRowDto {
  @ApiPropertyOptional({ description: 'Purchase order number text', example: 'PO-001' })
  @IsOptional()
  @IsString()
  poNumber?: string;

  @ApiPropertyOptional({ description: 'Style number text', example: 'ST-001' })
  @IsOptional()
  @IsString()
  styleNo?: string;

  @ApiPropertyOptional({ description: 'Style name text', example: 'Summer Shirt' })
  @IsOptional()
  @IsString()
  styleName?: string;

  @ApiPropertyOptional({ description: 'Color text', example: 'Blue' })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({ description: 'Size text', example: 'M' })
  @IsOptional()
  @IsString()
  size?: string;

  @ApiPropertyOptional({ description: 'Quantity', example: 100 })
  @IsOptional()
  quantity?: number | string | null;

  @ApiPropertyOptional({ description: 'Delivery date', example: '2026-05-05' })
  @IsOptional()
  @IsString()
  deliveryDate?: string | null;

  @ApiPropertyOptional({ description: 'FOB', example: 5.25 })
  @IsOptional()
  fob?: number | string | null;

  @ApiPropertyOptional({ description: 'Buyer ID', example: '8bf7d37e-4a62-47b1-b1e5-ded54c3cfb1f' })
  @IsOptional()
  @IsString()
  buyerId?: string;
}
