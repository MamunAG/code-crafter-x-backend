import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginationDto } from 'src/common/dto/pagination.dto';

export class FilterDesignationDto extends PaginationDto {
    @ApiProperty({ description: 'Designation name', example: 'Operator', required: false })
    @IsOptional()
    @IsString()
    designationName?: string;

    @ApiProperty({ description: 'Active status', example: true, required: false })
    @IsOptional()
    @IsString()
    isActive?: string;

    @ApiProperty({ description: 'Return only soft deleted designations', example: 'true', required: false })
    @IsOptional()
    deletedOnly?: string | boolean;
}