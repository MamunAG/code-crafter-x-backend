import { ApiProperty, PartialType } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
} from 'class-validator';

import { CreateUserDto } from './create-user.dto';

export class UpdateProfilePhoneNoDto extends PartialType(CreateUserDto) {
  @ApiProperty({ description: 'User phone number', example: '+8801XXXXXXXXX', required: false, })
  @IsString()
  @IsNotEmpty({ message: 'Phone number is required' })
  phone_no: string;
}
