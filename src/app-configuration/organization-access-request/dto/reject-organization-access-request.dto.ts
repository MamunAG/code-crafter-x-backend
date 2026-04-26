import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class RejectOrganizationAccessRequestDto {
  @ApiProperty({ description: 'Optional rejection reason', required: false, nullable: true })
  @IsOptional()
  @IsString()
  reviewNote?: string;
}
