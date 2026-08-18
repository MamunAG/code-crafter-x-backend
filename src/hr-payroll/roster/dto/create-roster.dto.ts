import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ArrayMaxSize, IsArray, IsDateString, IsOptional, IsUUID } from 'class-validator';

export class CreateRosterDto {
  @ApiProperty() @IsUUID() employeeId: string;
  @ApiProperty() @IsUUID() shiftId: string;
  @ApiProperty() @IsDateString() effectiveFrom: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() effectiveTo?: string;
  @ApiPropertyOptional({ type: [Number] }) @IsOptional() @IsArray() @ArrayMaxSize(7) weeklyOffDays?: number[];
}
