import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';

export class FilterMenuPermissionDto {
  @ApiPropertyOptional({ description: 'Organization ID' })
  @IsUUID()
  organizationId: string;

  @ApiPropertyOptional({ description: 'User ID receiving permissions' })
  @IsOptional()
  @IsUUID()
  userId?: string;
}
