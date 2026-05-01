import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from 'src/common/entities/base.entity';
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Organization } from 'src/app-configuration/organization/entity/organization.entity';

@Entity('country')
export class Country extends BaseEntity {
  @ApiProperty({ description: 'Primary ID' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: 'Country name', example: 'Bangladesh' })
  @Column({ name: 'name', nullable: false })
  name: string;

  @ApiProperty({ description: 'Organization ID', example: 'd290f1ee-6c54-4b01-90e6-d701748f0851' })
  @Column({ name: 'organization_id', type: 'uuid', nullable: true })
  organizationId?: string | null;

  @ApiProperty({ description: 'Organization', type: () => Organization, required: false })
  @ManyToOne(() => Organization, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organization_id' })
  organization?: Organization | null;

  @ApiProperty({ description: 'Active status', example: true })
  @Column({ name: 'is_active', type: 'boolean', default: true, nullable: false })
  isActive: boolean;
}
