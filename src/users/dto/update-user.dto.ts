import { ApiProperty, PartialType } from '@nestjs/swagger';
import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

import { Status } from '../../common/enums';
import { CreateUserDto } from './create-user.dto';
import { RolesEnum } from 'src/common/enums/role.enum';
import { Gender } from '../enum/gender.enum';

export class UpdateUserDto extends PartialType(CreateUserDto) {

  // ✅ first-screen
  @ApiProperty({ description: 'User name', example: 'johndoe' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'User email', example: 'user@example.com' })
  @IsString()
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'User phone number', example: '+8801XXXXXXXXX', required: false, })
  @IsString()
  @IsNotEmpty({ message: 'Phone number is required' })
  phone_no: string;

  @ApiProperty({ description: 'Date of birth', example: '2025-03-14T12:00:00.000Z', })
  @IsNotEmpty()
  @IsDateString()
  @IsOptional()
  date_of_birth?: Date;

  @ApiProperty({ description: `Gender must be within ${Object.values(Gender).join(', ')}`, enum: Gender, example: Gender.male, })
  @IsEnum(Gender, { message: `Gender must be within ${Object.values(Gender).join(', ')}` })
  @IsOptional()
  gender: Gender;

  // ✅ second-screen
  @ApiProperty({ description: 'User name', example: 'user@007' })
  @IsString()
  @IsNotEmpty()
  user_name: string;

  // ✅ third-screen
  // @ApiProperty({ description: 'User password', example: 'p@ssword' })
  // @IsString()
  // @IsNotEmpty()
  // @MinLength(6)
  // password: string;

  // ✅ fourth-screen
  @ApiProperty({ description: 'User profile pic id', example: 1, required: false })
  @IsOptional()
  @IsNumber()
  file_id?: number;

  @ApiProperty({ description: 'User display name', example: 'My Name', required: true, })
  @IsString()
  @IsNotEmpty()
  display_name: string;

  @ApiProperty({ description: 'User bio', example: 'abc efg ijk', required: false, })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiProperty({ description: 'User role', example: RolesEnum.user, enum: RolesEnum })
  @IsEnum(RolesEnum)
  @IsNotEmpty()
  role: RolesEnum;

  @ApiProperty({ description: 'User status', example: Status.active, enum: Status })
  @IsOptional()
  @IsEnum(Status)
  status?: Status = Status.active;

  @ApiProperty({ description: 'Updated by user id', example: 'xxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', })
  @IsString()
  @IsOptional()
  updated_by?: string;
}
