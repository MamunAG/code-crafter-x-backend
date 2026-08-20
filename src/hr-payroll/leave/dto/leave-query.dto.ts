import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';
import { TenantPaginationDto } from '../../common/dto/tenant-pagination.dto';

export class LeaveQueryDto extends TenantPaginationDto {
  @ApiPropertyOptional() @IsOptional() @IsUUID() employeeId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() leaveTypeId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() status?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() fromDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() toDate?: string;
}

export class LeaveBalanceAdjustmentDto {
  @ApiProperty() @IsUUID() employeeId: string;
  @ApiProperty() @IsUUID() leaveTypeId: string;
  @ApiProperty() @Type(() => Number) @IsNumber({ maxDecimalPlaces: 2 }) amount: number;
  @ApiProperty() @IsDateString() effectiveDate: string;
  @ApiProperty() @IsString() reason: string;
  @ApiPropertyOptional() @IsOptional() @IsString() reference?: string;
}
