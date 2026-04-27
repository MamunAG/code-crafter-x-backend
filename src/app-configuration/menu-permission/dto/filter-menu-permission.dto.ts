import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';

export class FilterMenuPermissionDto {
  @ApiPropertyOptional({ description: 'User ID receiving permissions' })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional({ description: 'Organization ID permissions belong to' })
  @IsOptional()
  @IsUUID()
  organizationId?: string;
}
