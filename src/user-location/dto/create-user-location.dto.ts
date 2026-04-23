import { ApiProperty, PartialType } from '@nestjs/swagger';
import { UserLocation } from '../entities/user-location.entity';
import { IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateUserLocationDto extends PartialType(UserLocation) {
  @ApiProperty({ description: 'Created by user id', example: '8e530fda-deef-4d68-8024-3087d1dd7f17', })
  @IsUUID()
  @IsNotEmpty()
  user_id: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  latitude: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  longitude: number;

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
