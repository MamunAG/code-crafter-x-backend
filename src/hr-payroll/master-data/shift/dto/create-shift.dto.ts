import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class CreateShiftDto {
  @ApiProperty() @IsString() @IsNotEmpty() code: string;
  @ApiProperty() @IsString() @IsNotEmpty() name: string;
  @ApiProperty({ example: '08:00' }) @IsString() startTime: string;
  @ApiProperty({ example: '17:00' }) @IsString() endTime: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) breakMinutes?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) graceInMinutes?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) graceOutMinutes?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) overtimeAfterMinutes?: number;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isOvernight?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isFlexible?: boolean;
}
