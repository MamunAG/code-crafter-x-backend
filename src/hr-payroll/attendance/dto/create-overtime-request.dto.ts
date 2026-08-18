import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class CreateOvertimeRequestDto {
  @ApiProperty() @IsUUID() employeeId: string;
  @ApiProperty() @IsDateString() workDate: string;
  @ApiProperty() @IsInt() @Min(1) requestedMinutes: number;
  @ApiPropertyOptional() @IsOptional() @IsString() reason?: string;
}
