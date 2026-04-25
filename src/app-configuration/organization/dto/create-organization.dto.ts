import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional } from 'class-validator';
import { Organization } from '../entity/organization.entity';

export class CreateOrganizationDto extends PartialType(Organization) {
  @ApiProperty({ description: 'Organization name', example: 'Code Crafter X' })
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Organization address', example: '123 Main Street, Dhaka', required: false, nullable: true })
  @IsOptional()
  address?: string | null;

  @ApiProperty({ description: 'Organization contact', example: '+8801712345678', required: false, nullable: true })
  @IsOptional()
  contact?: string | null;
}
