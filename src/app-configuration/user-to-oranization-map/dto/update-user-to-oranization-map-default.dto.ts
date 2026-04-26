import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class UpdateUserToOranizationMapDefaultDto {
  @ApiProperty({ description: 'Whether the organization should be the default selection', default: false })
  @IsBoolean()
  isDefault: boolean;
}
