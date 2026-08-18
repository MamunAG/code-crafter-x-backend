import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class CreateLoanDto {
  @ApiProperty() @IsUUID() employeeId: string;
  @ApiProperty() @IsString() @IsNotEmpty() loanNumber: string;
  @ApiProperty() @Type(() => Number) @IsNumber() @Min(0.01) principal: number;
  @ApiProperty() @Type(() => Number) @IsNumber() @Min(0.01) installmentAmount: number;
  @ApiProperty() @IsDateString() startDate: string;
  @ApiPropertyOptional() @IsOptional() @IsString() remarks?: string;
}
