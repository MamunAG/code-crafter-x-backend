import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsBoolean, IsEmail, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { Buyer } from '../entity/buyer.entity';

export class CreateBuyerDto extends PartialType(Buyer) {
  @ApiProperty({ description: 'Buyer name', example: 'ABC Trading Ltd.' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Buyer display name', example: 'ABC Trading' })
  @IsString()
  @IsNotEmpty()
  displayName: string;

  @ApiPropertyOptional({ description: 'Buyer contact', example: '+8801712345678' })
  @IsOptional()
  @IsString()
  contact?: string | null;

  @ApiPropertyOptional({ description: 'Buyer email', example: 'buyer@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string | null;

  @ApiPropertyOptional({ description: 'Country ID', example: 1 })
  @IsOptional()
  @IsNumber()
  countryId?: number | null;

  @ApiPropertyOptional({ description: 'Buyer address', example: 'Dhaka, Bangladesh' })
  @IsOptional()
  @IsString()
  address?: string | null;

  @ApiProperty({ description: 'Active status', example: true })
  @IsBoolean()
  isActive: boolean;

  @ApiPropertyOptional({ description: 'Buyer remarks', example: 'Preferred export buyer.' })
  @IsOptional()
  @IsString()
  remarks?: string | null;
}
