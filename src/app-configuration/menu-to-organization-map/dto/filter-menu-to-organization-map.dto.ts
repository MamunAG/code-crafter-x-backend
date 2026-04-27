import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class FilterMenuToOrganizationMapDto {
  @ApiProperty({ description: 'Organization ID' })
  @IsUUID()
  organizationId: string;
}
