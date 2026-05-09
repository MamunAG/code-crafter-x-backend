import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsNumber, IsOptional, IsUUID, Min, ValidateNested } from 'class-validator';
import { CreateTnaDetailDto } from './create-tna-detail.dto';

export class CreateTnaDto {
  @ApiProperty({ description: 'Buyer ID', example: '8bf7d37e-4a62-47b1-b1e5-ded54c3cfb1f' })
  @IsUUID()
  buyerId: string;

  @ApiProperty({ description: 'Job ID', example: '8bf7d37e-4a62-47b1-b1e5-ded54c3cfb1f' })
  @IsUUID()
  jobId: string;

  @ApiProperty({ description: 'Lead time', example: 30 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  leadTime: number;

  @ApiPropertyOptional({ description: 'TNA detail rows', type: () => [CreateTnaDetailDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateTnaDetailDto)
  tnaDetails?: CreateTnaDetailDto[];
}
