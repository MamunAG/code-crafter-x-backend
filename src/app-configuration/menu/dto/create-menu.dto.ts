import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateMenuDto {
  @ApiPropertyOptional({ description: 'Created by user ID' })
  @IsOptional()
  @IsString()
  created_by_id?: string;

  @ApiProperty({ description: 'Menu display name', example: 'Dashboard' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  menuName: string;

  @ApiProperty({ description: 'Menu navigation path', example: '/dashboard' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  menuPath: string;

  @ApiProperty({ description: 'Menu description', required: false })
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
