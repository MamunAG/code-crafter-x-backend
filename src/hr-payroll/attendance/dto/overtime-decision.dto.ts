import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, Min } from 'class-validator';
import { AttendanceDecisionDto } from './attendance-decision.dto';

export class OvertimeDecisionDto extends AttendanceDecisionDto {
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) approvedMinutes?: number;
}
