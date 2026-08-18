import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString, IsUUID } from 'class-validator';
import { TenantPaginationDto } from '../../common/dto/tenant-pagination.dto';

export class ReportQueryDto extends TenantPaginationDto {
  @ApiPropertyOptional() @IsOptional() @IsDateString() dateFrom?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() dateTo?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() factoryId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() employeeId?: string;
  @ApiPropertyOptional({ enum: ['json', 'xlsx', 'pdf'] }) @IsOptional() @IsString() format?: 'json' | 'xlsx' | 'pdf';
  @ApiPropertyOptional({ enum: ['en', 'bn'] }) @IsOptional() @IsString() language?: 'en' | 'bn';
}
