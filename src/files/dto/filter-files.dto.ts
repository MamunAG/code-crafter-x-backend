import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

import { PaginationDto } from '../../common/dto/pagination.dto';
import { FileType } from '../entities/file.entity';

export class FilterFilesDto extends PaginationDto {
  @ApiProperty({ description: 'Filter by assigned rider ID', required: false })
  @IsOptional()
  @IsNumber()
  @Min(1)
  assignedRiderId?: number;

  @ApiProperty({ description: 'Filter by name (exact)', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  file_name?: string;

  @ApiProperty({
    description: 'Search by name or passport number',
    required: false,
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({
    description: 'Type of file',
    enum: FileType,
    required: false,
  })
  @IsOptional()
  @IsEnum(FileType, { message: 'Invalid file type' })
  file_type?: FileType;
}
