import { ApiProperty } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';

import { FileCategory, FileType } from '../entities/file.entity';

export class FileResponseDto {
  @ApiProperty({
    description: 'Success status of the upload operation',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Unique identifier of the uploaded file',
    example: 456,
  })
  file_id: number;

  @ApiProperty({
    description: 'URL/path to access the uploaded file',
    example: 'https://cdn.example.com/files/456.jpg',
  })
  file_url: string;

  @ApiProperty({
    description: 'URL/path to access the thumbnail (if available)',
    example: 'https://cdn.example.com/files/456_thumb.jpg',
    required: false,
  })
  thumbnail_url?: string;

  @ApiProperty({
    description: 'Original filename of the uploaded file',
    example: 'student_photo.jpg',
  })
  original_name: string;

  @ApiProperty({
    description: 'Generated filename for storage',
    example: '1703123456789_student_photo.jpg',
  })
  file_name: string;

  @ApiProperty({
    description: 'Size of the file in bytes',
    example: 245760,
  })
  file_size: number;

  @ApiProperty({
    description: 'MIME type of the file',
    example: 'image/jpeg',
  })
  mime_type: string;

  @ApiProperty({
    description: 'Type of file',
    enum: FileType,
    example: FileType.AUDIO,
  })
  file_type: FileType;

  @ApiProperty({
    description: 'Category of the file',
    enum: FileCategory,
    example: FileCategory.PERSONAL,
  })
  file_category: FileCategory;

  @ApiProperty({
    description: 'Success message',
    example: 'File uploaded successfully',
  })
  message: string;

  @ApiProperty({
    description: 'public_url',
    example: 'public_url',
  })
  @IsOptional()
  public_url: string;
}
