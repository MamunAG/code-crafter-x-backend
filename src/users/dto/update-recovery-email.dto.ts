import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional } from 'class-validator';

export class UpdateRecoveryEmailDto {
  @ApiProperty({
    description: 'Separate recovery email used for account password reset',
    example: 'recovery@example.com',
    required: false,
  })
  @IsOptional()
  @IsEmail({}, { message: 'Please provide a valid recovery email address' })
  @Transform(({ value }) => {
    if (typeof value !== 'string') {
      return value;
    }

    const normalized = value.trim().toLowerCase();
    return normalized || undefined;
  })
  recovery_email?: string;
}
