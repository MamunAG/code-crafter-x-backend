import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { Style } from '../entity/style.entity';

export class CreateStyleDto extends PartialType(Style) {
  @ApiProperty({ description: 'Product type', example: 'Woven' })
  @IsOptional()
  @IsString()
  productType?: string;

  @ApiProperty({ description: 'Buyer ID', example: 'uuid' })
  @IsString()
  @IsNotEmpty()
  buyerId: string;

  @ApiProperty({ description: 'Style number', example: 'ST-001' })
  @IsString()
  @IsNotEmpty()
  styleNo: string;

  @ApiProperty({ description: 'Style name', example: 'Summer Shirt' })
  @IsOptional()
  @IsString()
  styleName?: string;

  @ApiProperty({ description: 'Item type', example: 'Top' })
  @IsOptional()
  @IsString()
  itemType?: string;

  @ApiProperty({ description: 'Product department', example: 'Mens Wear' })
  @IsOptional()
  @IsString()
  productDepartment?: string;

  @ApiProperty({ description: 'CM sewing', example: 0 })
  @IsNumber()
  cmSewing: number;

  @ApiProperty({ description: 'Currency ID', example: 1 })
  @IsNumber()
  currencyId: number;

  @ApiProperty({ description: 'SMV sewing', example: 0 })
  @IsNumber()
  smvSewing: number;

  @ApiProperty({ description: 'SMV sewing side seam', example: 0 })
  @IsNumber()
  smvSewingSideSeam: number;

  @ApiProperty({ description: 'SMV cutting', example: 0 })
  @IsNumber()
  smvCutting: number;

  @ApiProperty({ description: 'SMV cutting side seam', example: 0 })
  @IsNumber()
  smvCuttingSideSeam: number;

  @ApiProperty({ description: 'SMV finishing', example: 0 })
  @IsNumber()
  smvFinishing: number;

  @ApiProperty({ description: 'Image ID', example: 1, required: false })
  @IsOptional()
  @IsNumber()
  imageId?: number;

  @ApiProperty({ description: 'Remarks', example: 'Prototype style.' })
  @IsOptional()
  @IsString()
  remarks?: string;

  @ApiProperty({ description: 'Active status', example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ description: 'Item UOM', example: 'Pcs' })
  @IsOptional()
  @IsString()
  itemUom?: 'Pcs' | 'Set';

  @ApiProperty({ description: 'Product family', example: 'Knitwear' })
  @IsOptional()
  @IsString()
  productFamily?: string;
}
