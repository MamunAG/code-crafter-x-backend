import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginationDto } from 'src/common/dto/pagination.dto';

export class FilterMaterialDto extends PaginationDto {
  @ApiProperty({
    description: 'Material name',
    example: 'Cotton Fabric',
    required: false,
  })
  @IsOptional()
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Material code',
    example: 'MAT-001',
    required: false,
  })
  @IsOptional()
  @IsString()
  code: string;

  @ApiProperty({
    description: 'Material description',
    example: 'cotton',
    required: false,
  })
  @IsOptional()
  @IsString()
  description: string;

  @ApiProperty({
    description: 'Active status',
    example: 'true',
    required: false,
  })
  @IsOptional()
  @IsString()
  isActive: string;

  @ApiProperty({
    description: 'Material remarks',
    example: 'Preferred',
    required: false,
  })
  @IsOptional()
  @IsString()
  remarks: string;

  @ApiProperty({
    description: 'Return only soft deleted materials',
    example: 'true',
    required: false,
  })
  @IsOptional()
  deletedOnly?: string | boolean;
}
