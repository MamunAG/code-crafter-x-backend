import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsString,
} from 'class-validator';

import { SettingEnum } from '../enum/setting.enum';

export class UpdatProfileSettingsStatusChangeDto {
  @ApiProperty({ description: `Must be within ${Object.values(SettingEnum).join(', ')}`, enum: SettingEnum, example: SettingEnum.is_Save_your_activity_on_this_device })
  @IsEnum(SettingEnum, { message: `Must be within ${Object.values(SettingEnum).join(', ')}` })
  @IsNotEmpty()
  @IsString()
  setting: SettingEnum;

  @IsBoolean()
  @IsNotEmpty()
  enable: boolean;
}
