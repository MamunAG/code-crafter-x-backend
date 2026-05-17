import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsInt, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class CreateTnaDetailDto {
  @ApiProperty({ description: 'TNA task ID', example: '8bf7d37e-4a62-47b1-b1e5-ded54c3cfb1f' })
  @IsUUID()
  taskId: string;

  @ApiProperty({ description: 'Execution date', example: '2026-05-05' })
  @IsDateString()
  executionDate: string;

  @ApiProperty({ description: 'Days', example: 7 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  days: number;

  @ApiPropertyOptional({ description: 'Saved row sort order', example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  sortOrder?: number;

  @ApiPropertyOptional({ description: 'Relation formula', example: 'lead_time - 7' })
  @IsOptional()
  @IsString()
  relationFormula?: string;
}
