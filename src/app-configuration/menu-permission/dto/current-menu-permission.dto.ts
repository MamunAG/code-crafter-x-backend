import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID } from 'class-validator';

export class CurrentMenuPermissionDto {
  @ApiPropertyOptional({ description: 'Organization ID permissions belong to' })
  @IsOptional()
  @IsUUID()
  organizationId?: string;

  @ApiPropertyOptional({ description: 'Menu ID to check' })
  @IsOptional()
  @IsUUID()
  menuId?: string;

  @ApiPropertyOptional({ description: 'Menu navigation path to check' })
  @IsOptional()
  @IsString()
  menuPath?: string;

  @ApiPropertyOptional({ description: 'Menu display name to check' })
  @IsOptional()
  @IsString()
  menuName?: string;
}
