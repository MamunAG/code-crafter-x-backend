import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateOrganizationAccessRequestDto {
  @ApiProperty({ description: 'Admin email to send the request to' })
  @IsEmail()
  @IsNotEmpty()
  adminEmail: string;

  @ApiProperty({ description: 'Optional request message', required: false, nullable: true })
  @IsOptional()
  @IsString()
  message?: string;
}
