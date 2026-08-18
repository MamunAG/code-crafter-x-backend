import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsObject, IsOptional, IsString, Max, Min } from 'class-validator';

export class UpdateHrSettingsDto {
  @ApiPropertyOptional() @IsOptional() @IsString() timezone?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() currency?: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1) @Max(3) leaveApprovalLevels?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1) attendanceRoundingMinutes?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) overtimeCapMinutes?: number;
  @ApiPropertyOptional() @IsOptional() @IsObject() settings?: Record<string, unknown>;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1) rowVersion?: number;
}
