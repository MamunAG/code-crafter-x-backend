import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class ResendConfirmEmailDto {
  @ApiProperty({
    example: 'admin@blueatlantic.com',
    description: 'The email address to resend the verification code to',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email address is required' })
  email: string;
}
