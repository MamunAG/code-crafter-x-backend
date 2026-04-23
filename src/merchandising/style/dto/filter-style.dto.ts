import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from 'src/common/dto/pagination.dto';

export class FilterStyleDto extends PaginationDto {
  @ApiProperty({ description: 'Product type', example: 'Woven', required: false })
  @IsOptional()
  @IsString()
  productType?: string;

  @ApiProperty({ description: 'Buyer ID', example: 'uuid', required: false })
  @IsOptional()
  @IsString()
  buyerId?: string;

  @ApiProperty({ description: 'Style number', example: 'ST-001', required: false })
  @IsOptional()
  @IsString()
  styleNo?: string;

  @ApiProperty({ description: 'Style name', example: 'Summer Shirt', required: false })
  @IsOptional()
  @IsString()
  styleName?: string;

  @ApiProperty({ description: 'Currency ID', example: 1, required: false })
  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  currencyId?: number;

  @ApiProperty({ description: 'Image ID', example: 1, required: false })
  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  imageId?: number;

  @ApiProperty({ description: 'Active status', example: true, required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
