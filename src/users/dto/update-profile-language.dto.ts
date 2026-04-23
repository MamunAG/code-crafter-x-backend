import { ApiProperty, PartialType } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsString,
} from 'class-validator';

import { CreateUserDto } from './create-user.dto';
import { LanguageEnum } from '../enum/language.enum';

export class UpdatProfileLanguageDto extends PartialType(CreateUserDto) {
  @ApiProperty({ description: `Must be within ${Object.values(LanguageEnum).join(', ')}`, enum: LanguageEnum, example: LanguageEnum.English })
  @IsEnum(LanguageEnum, { message: `Must be within ${Object.values(LanguageEnum).join(', ')}` })
  @IsNotEmpty()
  @IsString()
  language: LanguageEnum;
}
