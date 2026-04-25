import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { RolesEnum } from 'src/common/enums/role.enum';

export class CreateUserToOranizationMapDto {
  @ApiProperty({ description: 'User ID', example: 'd290f1ee-6c54-4b01-90e6-d701748f0851' })
  @IsUUID()
  userId: string;

  @ApiProperty({ description: 'Organization ID', example: 'd290f1ee-6c54-4b01-90e6-d701748f0851' })
  @IsUUID()
  organizationId: string;

  @ApiProperty({ description: 'Membership role', example: RolesEnum.user, enum: RolesEnum, required: false })
  @IsOptional()
  @IsEnum(RolesEnum)
  role?: RolesEnum;
}
