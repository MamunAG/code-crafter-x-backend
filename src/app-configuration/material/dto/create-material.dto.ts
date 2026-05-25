import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Material } from '../entity/material.entity';

export class CreateMaterialDto extends PartialType(Material) {
  @ApiProperty({ description: 'Material name', example: 'Cotton Fabric' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: 'Material code', example: 'MAT-001' })
  @IsOptional()
  @IsString()
  code?: string | null;

  @ApiPropertyOptional({
    description: 'Material description',
    example: '100% cotton single jersey fabric',
  })
  @IsOptional()
  @IsString()
  description?: string | null;

  @ApiPropertyOptional({
    description: 'Material remarks',
    example: 'Preferred for summer programs.',
  })
  @IsOptional()
  @IsString()
  remarks?: string | null;

  @ApiProperty({ description: 'Active status', example: true, default: true })
  @IsBoolean()
  isActive: boolean = true;
}
