import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { Gender } from './gender.enum';

export class FilterEmployeeDto extends PaginationDto {
    @ApiProperty({ description: 'Factory ID', example: 'uuid', required: false })
    @IsOptional()
    @IsString()
    factoryId?: string;

    @ApiProperty({ description: 'Employee code', example: 'EMP-001', required: false })
    @IsOptional()
    @IsString()
    employeeCode?: string;

    @ApiProperty({ description: 'Employee name', example: 'Abdur Rahman', required: false })
    @IsOptional()
    @IsString()
    employeeName?: string;

    @ApiProperty({ description: 'Designation ID', example: 'uuid', required: false })
    @IsOptional()
    @IsString()
    designationId?: string;

    @ApiProperty({ description: 'Department ID', example: 'uuid', required: false })
    @IsOptional()
    @IsString()
    departmentId?: string;

    @ApiProperty({ description: 'Gender', enum: Gender, example: Gender.Male, required: false, })
    @IsOptional()
    @IsEnum(Gender)
    gender?: Gender;

    @ApiProperty({ description: 'Active status', example: true, required: false })
    @IsOptional()
    @IsString()
    isActive?: string;

    @ApiProperty({ description: 'Return only soft deleted employees', example: 'true', required: false })
    @IsOptional()
    deletedOnly?: string | boolean;
}