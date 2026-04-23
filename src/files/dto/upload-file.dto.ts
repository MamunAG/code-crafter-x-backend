import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

import { FileCategory, FileType } from '../entities/file.entity';

export class UploadFileDto {
  @ApiProperty({
    description: 'Type of file (profile_picture, document, receipt, etc.)',
    enum: FileType,
    example: FileType.OTHER,
  })
  @IsEnum(FileType)
  file_type: FileType;

  @ApiProperty({
    description:
      'Category of the file (personal, financial, medical, administrative, etc.)',
    enum: FileCategory,
    example: FileCategory.PERSONAL,
  })
  @IsEnum(FileCategory)
  file_category: FileCategory;

  @ApiProperty({
    description:
      'Type of entity this file belongs to (e.g., "users", "courses")',
    example: 'students',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  entity_type: string;

  @ApiProperty({
    description: 'ID of the entity this file belongs to',
    example: 123,
  })
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber()
  entity_id: number;

  @ApiProperty({
    description: 'ID of the user',
    example: 123,
  })
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber()
  @IsOptional()
  uploadedBy: string;
}
