import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsUUID, ValidateNested } from 'class-validator';

export class UpsertMenuPermissionItemDto {
  @ApiProperty({ description: 'Menu ID' })
  @IsUUID()
  menuId: string;

  @ApiProperty({ description: 'Can view this menu' })
  @IsBoolean()
  canView: boolean;

  @ApiProperty({ description: 'Can create from this menu' })
  @IsBoolean()
  canCreate: boolean;

  @ApiProperty({ description: 'Can update from this menu' })
  @IsBoolean()
  canUpdate: boolean;

  @ApiProperty({ description: 'Can delete from this menu' })
  @IsBoolean()
  canDelete: boolean;
}

export class UpsertMenuPermissionDto {
  @ApiProperty({ description: 'Organization ID' })
  @IsUUID()
  organizationId: string;

  @ApiProperty({ description: 'User ID receiving permissions' })
  @IsUUID()
  userId: string;

  @ApiProperty({ description: 'Menu permissions', type: [UpsertMenuPermissionItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpsertMenuPermissionItemDto)
  permissions: UpsertMenuPermissionItemDto[];
}
