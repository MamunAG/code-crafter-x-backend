import { ApiProperty } from '@nestjs/swagger';
import { Organization } from 'src/app-configuration/organization/entity/organization.entity';
import { BaseEntity } from 'src/common/entities/base.entity';
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

@Entity('color')
export class Color extends BaseEntity {
  @ApiProperty({ description: 'Primary ID' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: 'Color name', example: 'Blue' })
  @Column({ name: 'color_name', nullable: false })
  colorName: string;

  @ApiProperty({ description: 'Color display name', example: 'Ocean Blue' })
  @Column({ name: 'color_display_name', nullable: true })
  colorDisplayName: string;

  @ApiProperty({ description: 'Organization ID', example: 'd290f1ee-6c54-4b01-90e6-d701748f0851' })
  @Column({ name: 'organization_id', type: 'uuid', nullable: true })
  organizationId?: string | null;

  @ApiProperty({ description: 'Color description', example: 'Deep blue shade used for denim.' })
  @Column({ name: 'color_description', type: 'text', nullable: true })
  colorDescription: string;

  @ApiProperty({ description: 'Hex color code', example: '#1E88E5', required: false, nullable: true })
  @Column({ name: 'color_hex_code', type: 'varchar', nullable: true })
  colorHexCode?: string | null;

  @ApiProperty({ description: 'Active status', example: true })
  @Column({ name: 'is_active', type: 'boolean', default: true, nullable: false })
  isActive: boolean;

  @ApiProperty({ description: 'Organization', type: () => Organization, required: false })
  @ManyToOne(() => Organization, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organization_id' })
  organization?: Organization | null;
}
