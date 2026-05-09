import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateTnaTaskDto {
  @ApiProperty({ description: 'TNA task name', example: 'Pattern Making' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: 'Active status', example: true, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;
}
