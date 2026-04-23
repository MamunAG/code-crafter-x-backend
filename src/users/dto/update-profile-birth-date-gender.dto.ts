import { ApiProperty, PartialType } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
} from 'class-validator';

import { CreateUserDto } from './create-user.dto';
import { Gender } from '../enum/gender.enum';

export class UpdateProfileBirthDateGenderDto extends PartialType(CreateUserDto) {
  @ApiProperty({ description: 'Date of birth', example: '2025-03-14T12:00:00.000Z', })
  @IsNotEmpty()
  @IsDateString()
  date_of_birth?: Date;

  @ApiProperty({ description: `Gender must be within ${Object.values(Gender).join(', ')}`, enum: Gender, example: Gender.male, })
  @IsEnum(Gender, { message: `Gender must be within ${Object.values(Gender).join(', ')}` })
  @IsNotEmpty()
  gender?: Gender;
}
