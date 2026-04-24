import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';

import { FileCategory, FileType } from '../entities/file.entity';

export class CreateFileDto {
  @ApiProperty({ description: 'Generated or stored file name', example: '1703123456789_profile.jpg' })
  @IsString()
  @MaxLength(255)
  file_name: string;

  @ApiProperty({ description: 'Original file name', example: 'profile.jpg' })
  @IsString()
  @MaxLength(255)
  original_name: string;

  @ApiProperty({ description: 'Storage path or public URL path', example: '/uploads/profile.jpg' })
  @IsString()
  @MaxLength(500)
  file_path: string;

  @ApiProperty({ description: 'File size in bytes', example: 245760 })
  @Type(() => Number)
  @IsNumber()
  file_size: number;

  @ApiProperty({ description: 'MIME type', example: 'image/jpeg' })
  @IsString()
  @MaxLength(100)
  mime_type: string;

  @ApiProperty({ description: 'File type', enum: FileType, example: FileType.PHOTO })
  @IsEnum(FileType)
  file_type: FileType;

  @ApiProperty({ description: 'File category', enum: FileCategory, example: FileCategory.PERSONAL })
  @IsEnum(FileCategory)
  file_category: FileCategory;

  @ApiProperty({ description: 'Public file URL', required: false, example: 'https://cdn.example.com/profile.jpg' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  public_url?: string;
}
