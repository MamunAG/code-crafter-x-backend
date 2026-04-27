import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsUUID } from 'class-validator';

export class UpsertMenuToOrganizationMapDto {
  @ApiProperty({ description: 'Organization ID' })
  @IsUUID()
  organizationId: string;

  @ApiProperty({ description: 'Menu IDs mapped to this organization', type: [String] })
  @IsArray()
  @IsUUID('4', { each: true })
  menuIds: string[];
}
