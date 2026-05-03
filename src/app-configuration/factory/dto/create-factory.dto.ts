import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsBoolean, IsEmail, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { Factory } from '../entity/factory.entity';

export class CreateFactoryDto extends PartialType(Factory) {
    @ApiProperty({ description: 'Factory name', example: 'ABC Factory Ltd.' })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({ description: 'Factory display name', example: 'ABC Factory' })
    @IsString()
    @IsNotEmpty()
    displayName: string;

    @ApiPropertyOptional({ description: 'Factory code', example: 'FAC-001' })
    @IsOptional()
    @IsString()
    code?: string | null;

    @ApiPropertyOptional({ description: 'Factory contact', example: '+8801712345678' })
    @IsOptional()
    @IsString()
    contact?: string | null;

    @ApiPropertyOptional({ description: 'Factory email', example: 'factory@example.com' })
    @IsOptional()
    @IsEmail()
    email?: string | null;

    @ApiPropertyOptional({ description: 'Factory image file ID', example: 1 })
    @IsOptional()
    @IsNumber()
    imageId?: number | null;

    @ApiPropertyOptional({ description: 'Factory address', example: 'Dhaka, Bangladesh' })
    @IsOptional()
    @IsString()
    address?: string | null;

    @ApiProperty({ description: 'Active status', example: true })
    @IsBoolean()
    isActive: boolean;

    @ApiPropertyOptional({ description: 'Factory remarks', example: 'Main production factory.' })
    @IsOptional()
    @IsString()
    remarks?: string | null;
}
