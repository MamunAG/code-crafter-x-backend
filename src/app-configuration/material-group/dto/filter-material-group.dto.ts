import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginationDto } from 'src/common/dto/pagination.dto';

export class FilterMaterialGroupDto extends PaginationDto {
  @ApiProperty({
    description: 'Material group name',
    example: 'Fabric',
    required: false,
  })
  @IsOptional()
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Material group description',
    example: 'textile',
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
    description: 'Return only soft deleted material groups',
    example: 'true',
    required: false,
  })
  @IsOptional()
  deletedOnly?: string | boolean;
}
