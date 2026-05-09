import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { Supplier } from '../entity/supplier.entity';

export class CreateSupplierDto extends PartialType(Supplier) {
  @ApiProperty({ description: 'Supplier name', example: 'ABC Suppliers Ltd.' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Supplier display name',
    example: 'ABC Suppliers',
  })
  @IsString()
  @IsNotEmpty()
  displayName: string;

  @ApiPropertyOptional({ description: 'Supplier code', example: 'SUP-001' })
  @IsOptional()
  @IsString()
  code?: string | null;

  @ApiPropertyOptional({
    description: 'Supplier contact',
    example: '+8801712345678',
  })
  @IsOptional()
  @IsString()
  contact?: string | null;

  @ApiPropertyOptional({
    description: 'Supplier email',
    example: 'supplier@example.com',
  })
  @IsOptional()
  @IsEmail()
  email?: string | null;

  @ApiPropertyOptional({
    description: 'Supplier address',
    example: 'Dhaka, Bangladesh',
  })
  @IsOptional()
  @IsString()
  address?: string | null;

  @ApiProperty({ description: 'Active status', example: true, default: true })
  @IsBoolean()
  isActive: boolean = true;

  @ApiPropertyOptional({
    description: 'Supplier remarks',
    example: 'Primary fabric supplier.',
  })
  @IsOptional()
  @IsString()
  remarks?: string | null;
}
