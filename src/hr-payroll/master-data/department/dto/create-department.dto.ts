import { ApiProperty, OmitType } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Department } from '../entity/department.entity';

export class CreateDepartmentDto extends OmitType(Department, ['organization'] as const) {
    @ApiProperty({ description: 'Department name', example: 'Sewing' })
    @IsString()
    @IsNotEmpty()
    departmentName: string;

    @ApiProperty({ description: 'Description', example: 'Sewing production department', required: false })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiProperty({ description: 'Active status', example: true })
    @IsBoolean()
    isActive: boolean;
}