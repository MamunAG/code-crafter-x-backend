import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { Public } from './decorators/public.decorator';
import { BaseResponseDto } from './dto/base-response.dto';
import { Gender } from '../users/enum/gender.enum';

@ApiTags('Common')
@Controller('api/v1/common')
@Public()
export class CommonController {
  @Get('genders')
  @ApiOperation({ summary: 'Get gender options' })
  @ApiResponse({ status: 200, description: 'Gender options retrieved' })
  getGenders(): BaseResponseDto<string[]> {
    return new BaseResponseDto(Object.values(Gender), 'Gender options retrieved');
  }
}

