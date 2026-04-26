import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength, Min } from 'class-validator';
import { Menu } from '../entity/menu.entity';

export class CreateMenuDto extends PartialType(Menu) {
  @ApiProperty({ description: 'Organization ID that owns this menu entry' })
  @IsUUID()
  organizationId: string;

  @ApiProperty({ description: 'Menu display name', example: 'Dashboard' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  menuName: string;

  @ApiProperty({ description: 'Menu navigation path', example: '/dashboard' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  menuPath: string;

  @ApiProperty({ description: 'Menu description', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiProperty({ description: 'Sort order', example: 1, default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  displayOrder?: number;

  @ApiProperty({ description: 'Active status', example: true, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
