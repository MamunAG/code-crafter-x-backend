import { ApiProperty, OmitType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsDateString, IsEmail, IsEnum, IsNotEmpty, IsNumber, IsObject, IsOptional, IsString, IsUUID } from 'class-validator';
import { Employee } from '../entity/employee.entity';
import { Gender } from './gender.enum';
import type { EmployeeProfileData } from '../employee-profile.types';

export class CreateEmployeeDto extends OmitType(Employee, ['factory', 'organization', 'image'] as const) {
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

    @ApiProperty({ description: 'Employee image file ID', example: 1, required: false })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    imageId?: number;

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

    @ApiProperty({ required: false }) @IsOptional() @IsUUID() employmentTypeId?: string;
    @ApiProperty({ required: false }) @IsOptional() @IsUUID() gradeId?: string;
    @ApiProperty({ required: false }) @IsOptional() @IsUUID() payGroupId?: string;
    @ApiProperty({ required: false }) @IsOptional() @IsUUID() workLocationId?: string;
    @ApiProperty({ required: false }) @IsOptional() @IsUUID() supervisorId?: string;
    @ApiProperty({ required: false }) @IsOptional() @IsDateString() dateOfBirth?: string;
    @ApiProperty({ required: false }) @IsOptional() @IsString() maritalStatus?: string;
    @ApiProperty({ required: false }) @IsOptional() @IsString() employmentStatus?: string;
    @ApiProperty({ required: false }) @IsOptional() @IsString() taxStatus?: string;
    @ApiProperty({ required: false }) @IsOptional() @IsString() taxIdentifier?: string;
    @ApiProperty({ required: false }) @IsOptional() @IsString() bankDetails?: string;
    @ApiProperty({ required: false }) @IsOptional() @IsString() emergencyContact?: string;
    @ApiProperty({ required: false, type: [Object] }) @IsOptional() @IsArray() dependents?: Array<Record<string, unknown>>;
    @ApiProperty({ required: false }) @IsOptional() @IsDateString() probationEndDate?: string;
    @ApiProperty({ required: false }) @IsOptional() @IsDateString() confirmationDate?: string;
    @ApiProperty({ required: false }) @IsOptional() @IsDateString() contractEndDate?: string;
    @ApiProperty({ required: false }) @IsOptional() @IsDateString() separationDate?: string;

    @ApiProperty({ required: false, type: Object })
    @IsOptional()
    @IsObject()
    profile?: EmployeeProfileData;

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
