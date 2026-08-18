import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsNumber, IsObject, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class AssignSalaryDto {
  @ApiProperty() @IsUUID() employeeId: string;
  @ApiProperty() @IsUUID() salaryStructureId: string;
  @ApiProperty() @IsDateString() effectiveFrom: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() effectiveTo?: string;
  @ApiProperty() @Type(() => Number) @IsNumber() @Min(0) baseAmount: number;
  @ApiPropertyOptional() @IsOptional() @IsString() currency?: string;
  @ApiPropertyOptional() @IsOptional() @IsObject() componentOverrides?: Record<string, number>;
}
