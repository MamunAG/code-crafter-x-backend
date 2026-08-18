import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsDateString, IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

export class CreateLeaveRequestDto {
  @ApiProperty() @IsUUID() employeeId: string;
  @ApiProperty() @IsUUID() leaveTypeId: string;
  @ApiProperty() @IsDateString() startDate: string;
  @ApiProperty() @IsDateString() endDate: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isHalfDay?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsString() reason?: string;
  @ApiPropertyOptional({ minimum: 1, maximum: 3 }) @IsOptional() @IsInt() @Min(1) @Max(3) requiredApprovalLevels?: number;
}
