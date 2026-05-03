import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginationDto } from 'src/common/dto/pagination.dto';

export class FilterFactoryDto extends PaginationDto {
    @ApiProperty({ description: 'Factory name', example: 'ABC Factory Ltd.', required: false })
    @IsOptional()
    @IsString()
    name: string;

    @ApiProperty({ description: 'Factory display name', example: 'ABC Factory', required: false })
    @IsOptional()
    @IsString()
    displayName: string;

    @ApiProperty({ description: 'Factory code', example: 'FAC-001', required: false })
    @IsOptional()
    @IsString()
    code: string;

    @ApiProperty({ description: 'Factory contact', example: '+8801712345678', required: false })
    @IsOptional()
    @IsString()
    contact: string;

    @ApiProperty({ description: 'Factory email', example: 'factory@example.com', required: false })
    @IsOptional()
    @IsString()
    email: string;

    @ApiProperty({ description: 'Factory address', example: 'Dhaka, Bangladesh', required: false })
    @IsOptional()
    @IsString()
    address: string;

    @ApiProperty({ description: 'Active status', example: 'Y', required: false })
    @IsOptional()
    @IsString()
    isActive: string;

    @ApiProperty({ description: 'Factory remarks', example: 'Main production factory.', required: false })
    @IsOptional()
    @IsString()
    remarks: string;

    @ApiProperty({ description: 'Return only soft deleted factories', example: 'true', required: false })
    @IsOptional()
    deletedOnly?: string | boolean;
}