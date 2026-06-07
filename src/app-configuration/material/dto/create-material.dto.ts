import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
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

  @ApiPropertyOptional({ description: 'Unit ID', example: 1 })
  @IsOptional()
  @IsInt()
  unitId?: number | null;

  @ApiPropertyOptional({
    description: 'Material group ID',
    example: 'd290f1ee-6c54-4b01-90e6-d701748f0851',
  })
  @IsOptional()
  @IsUUID()
  materialGroupId?: string | null;

  @ApiPropertyOptional({ description: 'Image ID', example: 1 })
  @IsOptional()
  @IsInt()
  imageId?: number | null;

  @ApiProperty({ description: 'Active status', example: true, default: true })
  @IsBoolean()
  isActive: boolean = true;
}
