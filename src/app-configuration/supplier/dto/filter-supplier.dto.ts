import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginationDto } from 'src/common/dto/pagination.dto';

export class FilterSupplierDto extends PaginationDto {
  @ApiProperty({
    description: 'Supplier name',
    example: 'ABC Suppliers Ltd.',
    required: false,
  })
  @IsOptional()
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Supplier code',
    example: 'SUP-001',
    required: false,
  })
  @IsOptional()
  @IsString()
  code: string;

  @ApiProperty({
    description: 'Supplier contact',
    example: '+8801712345678',
    required: false,
  })
  @IsOptional()
  @IsString()
  contact: string;

  @ApiProperty({
    description: 'Supplier email',
    example: 'supplier@example.com',
    required: false,
  })
  @IsOptional()
  @IsString()
  email: string;

  @ApiProperty({
    description: 'Supplier address',
    example: 'Dhaka, Bangladesh',
    required: false,
  })
  @IsOptional()
  @IsString()
  address: string;

  @ApiProperty({
    description: 'Active status',
    example: 'true',
    required: false,
  })
  @IsOptional()
  @IsString()
  isActive: string;

  @ApiProperty({
    description: 'Supplier remarks',
    example: 'Primary fabric supplier.',
    required: false,
  })
  @IsOptional()
  @IsString()
  remarks: string;

  @ApiProperty({
    description: 'Return only soft deleted suppliers',
    example: 'true',
    required: false,
  })
  @IsOptional()
  deletedOnly?: string | boolean;
}
