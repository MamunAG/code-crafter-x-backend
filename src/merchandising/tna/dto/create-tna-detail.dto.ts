import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsDateString, IsInt, IsNumber, IsOptional, IsString, IsUUID, Min, ValidateNested } from 'class-validator';

export class CreateTnaDetailRevisionDto {
  @ApiProperty({ description: 'Execution date before revision', example: '2026-05-05' })
  @IsDateString()
  previousExecutionDate: string;

  @ApiProperty({ description: 'Execution date after revision', example: '2026-05-08' })
  @IsDateString()
  newExecutionDate: string;

  @ApiPropertyOptional({ description: 'Reason or note for revising the execution date', example: 'Fabric approval was delayed.' })
  @IsOptional()
  @IsString()
  note?: string;
}

export class CreateTnaDetailDto {
  @ApiPropertyOptional({ description: 'Existing TNA detail ID when updating', example: '8bf7d37e-4a62-47b1-b1e5-ded54c3cfb1f' })
  @IsOptional()
  @IsUUID()
  id?: string;

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

  @ApiPropertyOptional({ description: 'Staged revision records for this detail row', type: () => [CreateTnaDetailRevisionDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateTnaDetailRevisionDto)
  revisions?: CreateTnaDetailRevisionDto[];
}
