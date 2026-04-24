import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

import { PaginationDto } from '../../common/dto/pagination.dto';
import { FileCategory, FileType } from '../entities/file.entity';

export class FilterFilesDto extends PaginationDto {
  @ApiProperty({ description: 'Filter by uploader user id', required: false })
  @IsOptional()
  @IsString()
  uploaded_by?: string;

  @ApiProperty({ description: 'Filter by file name', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  file_name?: string;

  @ApiProperty({
    description: 'Search by file name, original name, or public url',
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

  @ApiProperty({
    description: 'Category of file',
    enum: FileCategory,
    required: false,
  })
  @IsOptional()
  @IsEnum(FileCategory, { message: 'Invalid file category' })
  file_category?: FileCategory;

  @ApiProperty({ description: 'Filter by public url', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  public_url?: string;
}
