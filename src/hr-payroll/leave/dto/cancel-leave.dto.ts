import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CancelLeaveDto {
  @ApiPropertyOptional() @IsOptional() @IsString() comment?: string;
  @ApiProperty() @IsInt() @Min(1) rowVersion: number;
}
