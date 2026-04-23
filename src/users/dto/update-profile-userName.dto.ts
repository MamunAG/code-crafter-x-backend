import { ApiProperty, PartialType } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
} from 'class-validator';

import { CreateUserDto } from './create-user.dto';

export class UpdatProfileUserNameDto extends PartialType(CreateUserDto) {
  @ApiProperty({ description: 'User name', example: 'user@007' })
  @IsString()
  @IsNotEmpty()
  user_name: string;
}
