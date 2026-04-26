import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { RolesEnum } from 'src/common/enums/role.enum';

export class UpdateUserToOranizationMapRoleDto {
  @ApiProperty({ description: 'Membership role to assign', example: RolesEnum.user, enum: RolesEnum })
  @IsEnum(RolesEnum)
  role: RolesEnum;
}
