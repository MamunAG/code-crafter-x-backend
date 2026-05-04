import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsDateString, IsEnum, IsNumber, IsOptional, IsUUID, ValidateNested } from 'class-validator';
import { OrderType } from '../entity/job.entity';
import { CreateJobDetailDto } from './create-job-detail.dto';

export class CreateJobDto {
  @ApiProperty({ description: 'Factory ID', example: '8bf7d37e-4a62-47b1-b1e5-ded54c3cfb1f' })
  @IsUUID()
  factoryId: string;

  @ApiProperty({ description: 'Buyer ID', example: '8bf7d37e-4a62-47b1-b1e5-ded54c3cfb1f' })
  @IsUUID()
  buyerId: string;

  @ApiPropertyOptional({ description: 'Merchandiser ID', example: 1 })
  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  merchandiserId?: number | null;

  @ApiPropertyOptional({ description: 'Order type', enum: OrderType, example: OrderType.Retail })
  @IsOptional()
  @IsEnum(OrderType)
  ordertype?: OrderType | null;

  @ApiPropertyOptional({ description: 'Total PO quantity', example: 1000 })
  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  totalPoQty?: number | null;

  @ApiPropertyOptional({ description: 'PO receive date', example: '2026-05-05' })
  @IsOptional()
  @IsDateString()
  poReceiveDate?: string | null;

  @ApiPropertyOptional({ description: 'Active status', example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Job detail rows', type: () => [CreateJobDetailDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateJobDetailDto)
  jobDetails?: CreateJobDetailDto[];
}
