import { ApiProperty, OmitType } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Designation } from '../entity/designation.entity';

export class CreateDesignationDto extends OmitType(Designation, ['organization'] as const) {
    @ApiProperty({ description: 'Designation name', example: 'Operator' })
    @IsString()
    @IsNotEmpty()
    designationName: string;

    @ApiProperty({ description: 'Description', example: 'Machine operator', required: false })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiProperty({ description: 'Active status', example: true })
    @IsBoolean()
    isActive: boolean;
}