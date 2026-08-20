import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsDateString, IsIn, IsInt, IsOptional, IsString, IsUrl, IsUUID, Max, Min } from 'class-validator';

export class CreateLeaveRequestDto {
  @ApiProperty() @IsUUID() employeeId: string;
  @ApiProperty() @IsUUID() leaveTypeId: string;
  @ApiProperty() @IsDateString() startDate: string;
  @ApiProperty() @IsDateString() endDate: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isHalfDay?: boolean;
  @ApiPropertyOptional({ enum: ['FULL_DAY', 'FIRST_HALF', 'SECOND_HALF', 'HOURLY'] }) @IsOptional() @IsIn(['FULL_DAY', 'FIRST_HALF', 'SECOND_HALF', 'HOURLY']) durationType?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() reason?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() contactDuringLeave?: string;
  @ApiPropertyOptional() @IsOptional() @IsUrl({ require_protocol: true }) attachmentUrl?: string;
  @ApiPropertyOptional({ minimum: 1, maximum: 3 }) @IsOptional() @IsInt() @Min(1) @Max(3) requiredApprovalLevels?: number;
}
