import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { MaterialGroup } from '../entity/material-group.entity';

export class CreateMaterialGroupDto extends PartialType(MaterialGroup) {
  @ApiProperty({ description: 'Material group name', example: 'Fabric' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    description: 'Material group description',
    example: 'Fabric and textile materials',
  })
  @IsOptional()
  @IsString()
  description?: string | null;

  @ApiProperty({ description: 'Active status', example: true, default: true })
  @IsBoolean()
  isActive: boolean = true;
}
