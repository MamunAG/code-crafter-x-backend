import { ApiProperty, PartialType } from '@nestjs/swagger';
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

  @ApiProperty({ description: 'Buyer contact', example: '+8801712345678' })
  @IsString()
  @IsNotEmpty()
  contact: string;

  @ApiProperty({ description: 'Buyer email', example: 'buyer@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ description: 'Country ID', example: 1 })
  @IsNumber()
  countryId: number;

  @ApiProperty({ description: 'Buyer address', example: 'Dhaka, Bangladesh' })
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiProperty({ description: 'Active status', example: true })
  @IsBoolean()
  isActive: boolean;

  @ApiProperty({ description: 'Buyer remarks', example: 'Preferred export buyer.' })
  @IsOptional()
  @IsString()
  remarks: string;
}
