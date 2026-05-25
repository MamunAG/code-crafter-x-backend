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
    description: 'Unit ID',
    example: '1',
    required: false,
  })
  @IsOptional()
  @IsString()
  unitId: string;

  @ApiProperty({
    description: 'Material group ID',
    example: 'd290f1ee-6c54-4b01-90e6-d701748f0851',
    required: false,
  })
  @IsOptional()
  @IsString()
  materialGroupId: string;

  @ApiProperty({
    description: 'Active status',
    example: 'true',
    required: false,
  })
  @IsOptional()
  @IsString()
  isActive: string;

  @ApiProperty({
    description: 'Return only soft deleted materials',
    example: 'true',
    required: false,
  })
  @IsOptional()
  deletedOnly?: string | boolean;
}
