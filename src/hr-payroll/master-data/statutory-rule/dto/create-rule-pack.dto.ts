import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';

export class CreateRulePackDto {
  @ApiProperty() @IsString() @IsNotEmpty() code: string;
  @ApiProperty() @IsString() @IsNotEmpty() name: string;
  @ApiPropertyOptional() @IsOptional() @IsString() jurisdiction?: string;
  @ApiProperty() @IsDateString() effectiveFrom: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() effectiveTo?: string;
  @ApiProperty() @IsObject() rules: Record<string, unknown>;
  @ApiProperty() @IsString() @IsNotEmpty() sourceUrl: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() sourcePublishedAt?: string;
}
