import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  IsString,
  ValidateNested,
} from 'class-validator';
import { RolesEnum } from 'src/common/enums/role.enum';

export class ApproveOrganizationAccessRequestAssignmentDto {
  @ApiProperty({ description: 'Organization ID to map the user to' })
  @IsUUID()
  @IsNotEmpty()
  organizationId: string;

  @ApiProperty({ description: 'Role to assign within the organization', enum: RolesEnum })
  @IsEnum(RolesEnum)
  role: RolesEnum;
}

export class ApproveOrganizationAccessRequestDto {
  @ApiProperty({
    description: 'Organizations and roles to assign to the requested user',
    type: [ApproveOrganizationAccessRequestAssignmentDto],
  })
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => ApproveOrganizationAccessRequestAssignmentDto)
  assignments: ApproveOrganizationAccessRequestAssignmentDto[];

  @ApiProperty({ description: 'Optional review note', required: false, nullable: true })
  @IsOptional()
  @IsString()
  reviewNote?: string;
}
