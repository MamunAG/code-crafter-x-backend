import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsNotEmpty, IsObject, IsOptional, IsString, Matches, MaxLength, Min } from 'class-validator';

export class CreateCategoryMasterDataDto {
  @ApiProperty({ example: 'PERMANENT' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  @Matches(/^[A-Za-z0-9_-]+$/, { message: 'code may contain letters, numbers, underscores, and hyphens only.' })
  code: string;

  @ApiProperty({ example: 'Permanent' }) @IsString() @IsNotEmpty() @MaxLength(255) name: string;
  @ApiPropertyOptional({ example: 'স্থায়ী' }) @IsOptional() @IsString() @MaxLength(255) nameBn?: string;
  @ApiPropertyOptional({ type: Object }) @IsOptional() @IsObject() settings?: Record<string, unknown>;
  @ApiPropertyOptional({ default: true }) @IsOptional() @IsBoolean() isActive?: boolean;
}

export class UpdateCategoryMasterDataDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @IsNotEmpty() @MaxLength(255) name?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(255) nameBn?: string;
  @ApiPropertyOptional({ type: Object }) @IsOptional() @IsObject() settings?: Record<string, unknown>;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isActive?: boolean;
  @ApiProperty() @IsInt() @Min(1) rowVersion: number;
}

export class MasterDataUploadDto {
  @ApiProperty({ type: 'string', format: 'binary' }) file: Express.Multer.File;
}
