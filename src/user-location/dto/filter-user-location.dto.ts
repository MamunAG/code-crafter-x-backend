import { ApiProperty } from '@nestjs/swagger';
import { IsNumberString, IsOptional, IsString, IsUUID } from 'class-validator';

import { PaginationDto } from '../../common/dto/pagination.dto';

export class FilterUserLocationDto extends PaginationDto {
  @ApiProperty({ description: 'Created by user id', example: 'xxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', })
  @IsUUID()
  @IsOptional()
  user_id: string;

  @ApiProperty()
  @IsOptional()
  @IsNumberString()
  area_in_length_km: number;

  @ApiProperty()
  @IsOptional()
  @IsString()
  area: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  city: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  state: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  country: string;
}
