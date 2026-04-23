import { ApiProperty, PartialType } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

import { CreateUserDto } from './create-user.dto';

export class UpdateProfileRollaDto extends PartialType(CreateUserDto) {
  @ApiProperty({ description: 'User profile picture id', example: 1, required: false })
  @IsOptional()
  @IsNumber()
  profile_pic_id?: number;

  @ApiProperty({ description: 'User name', example: 'johndoe' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'User bio', example: 'abc efg ijk', required: false, })
  @IsOptional()
  @IsString()
  bio?: string;
}
