import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { ApprovalStatus } from '../../common/hr.enums';

export class LeaveDecisionDto {
  @ApiProperty({ enum: [ApprovalStatus.Approved, ApprovalStatus.Rejected] }) @IsEnum(ApprovalStatus) decision: ApprovalStatus;
  @ApiPropertyOptional() @IsOptional() @IsString() comment?: string;
  @ApiProperty() @IsInt() @Min(1) rowVersion: number;
}
