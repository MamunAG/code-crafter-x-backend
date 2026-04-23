import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, Length } from 'class-validator';

export class VerifyCodeDto {
  @ApiProperty({
    example: 'admin@blueatlantic.com',
    description: 'The email address associated with the reset request',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email address is required' })
  email: string;

  @ApiProperty({
    example: '1234',
    description: 'The 4-digit verification code sent to your email',
    minLength: 4,
    maxLength: 4,
  })
  @IsString({ message: 'Code must be a string' })
  @IsNotEmpty({ message: 'Verification code is required' })
  @Length(4, 4, { message: 'Verification code must be exactly 4 digits' })
  code: string;
}
