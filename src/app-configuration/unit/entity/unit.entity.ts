import { ApiProperty } from '@nestjs/swagger';
import { Organization } from 'src/app-configuration/organization/entity/organization.entity';
import { BaseEntity } from 'src/common/entities/base.entity';
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

@Entity('uom')
export class Unit extends BaseEntity {
  @ApiProperty({ description: 'Primary ID' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: 'UOM name', example: 'Kilogram' })
  @Column({ name: 'name', nullable: false })
  name: string;

  @ApiProperty({ description: 'UOM short name', example: 'KG' })
  @Column({ name: 'short_name', nullable: false })
  shortName: string;

  @ApiProperty({ description: 'Organization ID', example: 'd290f1ee-6c54-4b01-90e6-d701748f0851' })
  @Column({ name: 'organization_id', type: 'uuid', nullable: true })
  organizationId?: string | null;

  @ApiProperty({ description: 'Active status', example: 'Y' })
  @Column({ name: 'is_active', type: 'varchar', length: 10, default: 'Y', nullable: false })
  isActive: string;

  @ApiProperty({ description: 'Organization', type: () => Organization, required: false })
  @ManyToOne(() => Organization, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organization_id' })
  organization?: Organization | null;
}
