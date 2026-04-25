import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class CreateUserToOranizationMapDto {
  @ApiProperty({ description: 'User ID', example: 'd290f1ee-6c54-4b01-90e6-d701748f0851' })
  @IsUUID()
  userId: string;

  @ApiProperty({ description: 'Organization ID', example: 'd290f1ee-6c54-4b01-90e6-d701748f0851' })
  @IsUUID()
  organizationId: string;
}
