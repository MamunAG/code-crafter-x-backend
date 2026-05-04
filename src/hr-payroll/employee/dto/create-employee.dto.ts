import { ApiProperty, OmitType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsDateString, IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Employee } from '../entity/employee.entity';
import { Gender } from './gender.enum';

export class CreateEmployeeDto extends OmitType(Employee, ['factory', 'organization'] as const) {
    @ApiProperty({ description: 'Factory ID', example: 'uuid' })
    @IsString()
    @IsNotEmpty()
    factoryId: string;

    @ApiProperty({ description: 'Employee code', example: 'EMP-001' })
    @IsString()
    @IsNotEmpty()
    employeeCode: string;

    @ApiProperty({ description: 'Employee name', example: 'Abdur Rahman' })
    @IsString()
    @IsNotEmpty()
    employeeName: string;

    @ApiProperty({ description: 'Designation ID', example: 'uuid', required: false })
    @IsOptional()
    @IsString()
    designationId?: string;

    @ApiProperty({ description: 'Department ID', example: 'uuid', required: false })
    @IsOptional()
    @IsString()
    departmentId?: string;

    @ApiProperty({ description: 'Phone number', example: '+8801700000000', required: false })
    @IsOptional()
    @IsString()
    phoneNo?: string;

    @ApiProperty({ description: 'Email', example: 'employee@example.com', required: false })
    @IsOptional()
    @IsEmail()
    email?: string;

    @ApiProperty({ description: 'Gender', enum: Gender, example: Gender.Male, required: false, })
    @IsOptional()
    @IsEnum(Gender)
    gender?: Gender;

    @ApiProperty({ description: 'Joining date', example: '2026-05-03', required: false })
    @IsOptional()
    @IsDateString()
    joiningDate?: Date;

    @ApiProperty({ description: 'NID / ID card number', example: '1234567890', required: false })
    @IsOptional()
    @IsString()
    nidNo?: string;

    @ApiProperty({ description: 'Address', example: 'Dhaka, Bangladesh', required: false })
    @IsOptional()
    @IsString()
    address?: string;

    @ApiProperty({ description: 'Remarks', example: 'Permanent employee', required: false })
    @IsOptional()
    @IsString()
    remarks?: string;

    @ApiProperty({ description: 'Active status', example: true })
    @Type(() => Boolean)
    @IsBoolean()
    isActive: boolean;
}