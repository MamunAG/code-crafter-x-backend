import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class PayrollTransitionDto {
  @ApiProperty() @IsInt() @Min(1) rowVersion: number;
  @ApiPropertyOptional() @IsOptional() @IsString() comment?: string;
}
