import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginationDto } from 'src/common/dto/pagination.dto';

export class FilterDepartmentDto extends PaginationDto {
    @ApiProperty({ description: 'Department name', example: 'Sewing', required: false })
    @IsOptional()
    @IsString()
    departmentName?: string;

    @ApiProperty({ description: 'Active status', example: true, required: false })
    @IsOptional()
    @IsString()
    isActive?: string;

    @ApiProperty({ description: 'Return only soft deleted departments', example: 'true', required: false })
    @IsOptional()
    deletedOnly?: string | boolean;
}