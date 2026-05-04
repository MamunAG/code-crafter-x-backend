import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class CreateJobDetailDto {
  @ApiProperty({ description: 'Purchase order number text', example: 'PO-001' })
  @IsString()
  @IsNotEmpty()
  pono: string;

  @ApiProperty({ description: 'Style ID', example: '8bf7d37e-4a62-47b1-b1e5-ded54c3cfb1f' })
  @IsUUID()
  styleId: string;

  @ApiProperty({ description: 'Size ID', example: 1 })
  @Type(() => Number)
  @IsNumber()
  sizeId: number;

  @ApiProperty({ description: 'Color ID', example: 1 })
  @Type(() => Number)
  @IsNumber()
  colorId: number;

  @ApiProperty({ description: 'Quantity', example: 1000 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  quantity: number;

  @ApiProperty({ description: 'FOB', example: 5.25 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  fob: number;

  @ApiProperty({ description: 'CM', example: 1.25 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  cm: number;

  @ApiPropertyOptional({ description: 'Delivery date', example: '2026-05-05' })
  @IsOptional()
  @IsDateString()
  deliveryDate?: string | null;

  @ApiPropertyOptional({ description: 'Remarks', example: 'First shipment' })
  @IsOptional()
  @IsString()
  remarks?: string | null;
}
