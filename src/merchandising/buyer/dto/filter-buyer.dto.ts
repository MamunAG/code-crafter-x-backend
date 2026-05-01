import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from 'src/common/dto/pagination.dto';

export class FilterBuyerDto extends PaginationDto {
  @ApiProperty({ description: 'Buyer name', example: 'ABC Trading Ltd.', required: false })
  @IsOptional()
  @IsString()
  name: string;

  @ApiProperty({ description: 'Buyer display name', example: 'ABC Trading', required: false })
  @IsOptional()
  @IsString()
  displayName: string;

  @ApiProperty({ description: 'Buyer contact', example: '+8801712345678', required: false })
  @IsOptional()
  @IsString()
  contact: string;

  @ApiProperty({ description: 'Buyer email', example: 'buyer@example.com', required: false })
  @IsOptional()
  @IsString()
  email: string;

  @ApiProperty({ description: 'Country ID', example: 1, required: false })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  countryId: number;

  @ApiProperty({ description: 'Buyer address', example: 'Dhaka, Bangladesh', required: false })
  @IsOptional()
  @IsString()
  address: string;

  @ApiProperty({ description: 'Active status', example: 'Y', required: false })
  @IsOptional()
  @IsString()
  isActive: string;

  @ApiProperty({ description: 'Buyer remarks', example: 'Preferred export buyer.', required: false })
  @IsOptional()
  @IsString()
  remarks: string;

  @ApiProperty({ description: 'Return only soft deleted buyers', example: 'true', required: false })
  @IsOptional()
  deletedOnly?: string | boolean;
}
