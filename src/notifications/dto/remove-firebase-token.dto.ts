import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class RemoveFirebaseTokenDto {
  @ApiProperty({ description: 'Firebase Cloud Messaging token to remove' })
  @IsString()
  @MinLength(20)
  token: string;
}
