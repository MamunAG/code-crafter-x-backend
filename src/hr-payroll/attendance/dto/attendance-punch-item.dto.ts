import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsNotEmpty, IsObject, IsOptional, IsString, IsUUID } from 'class-validator';
import { AttendanceDirection } from '../../common/hr.enums';

export class AttendancePunchItemDto {
  @ApiProperty() @IsString() @IsNotEmpty() externalEventId: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() employeeId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() employeeCode?: string;
  @ApiProperty() @IsDateString() punchedAt: string;
  @ApiPropertyOptional({ enum: AttendanceDirection }) @IsOptional() @IsEnum(AttendanceDirection) direction?: AttendanceDirection;
  @ApiPropertyOptional() @IsOptional() @IsString() deviceIdentifier?: string;
  @ApiPropertyOptional() @IsOptional() @IsObject() metadata?: Record<string, unknown>;
}
