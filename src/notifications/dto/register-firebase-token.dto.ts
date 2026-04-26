import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class RegisterFirebaseTokenDto {
  @ApiProperty({ description: 'Firebase Cloud Messaging token' })
  @IsString()
  @MinLength(20)
  token: string;

  @ApiProperty({ description: 'Client platform', required: false, example: 'web' })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  platform?: string;

  @ApiProperty({ description: 'Client user agent', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  userAgent?: string;
}
