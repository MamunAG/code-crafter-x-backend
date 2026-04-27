import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateModuleEntryDto {
  @ApiPropertyOptional({ description: 'Created by user ID' })
  @IsOptional()
  @IsString()
  created_by_id?: string;

  @ApiProperty({ description: 'Module display name', example: 'Merchandising' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  moduleName: string;

  @ApiProperty({ description: 'Unique module key', example: 'merchandising' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  moduleKey: string;

  @ApiProperty({ description: 'Module description', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiProperty({ description: 'Sort order', example: 1, default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  displayOrder?: number;

  @ApiProperty({ description: 'Active status', example: true, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Updated by user ID' })
  @IsOptional()
  @IsString()
  updated_by_id?: string;
}
