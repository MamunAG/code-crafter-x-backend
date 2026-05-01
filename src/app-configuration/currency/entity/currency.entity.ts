import { ApiProperty } from '@nestjs/swagger';
import { Organization } from 'src/app-configuration/organization/entity/organization.entity';
import { BaseEntity } from 'src/common/entities/base.entity';
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

@Entity('currency')
export class Currency extends BaseEntity {
  @ApiProperty({ description: 'Primary ID' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: 'Currency name', example: 'Bangladeshi Taka' })
  @Column({ name: 'currencyname', nullable: false })
  currencyName: string;

  @ApiProperty({ description: 'Currency code', example: 'BDT' })
  @Column({ name: 'currencycode', nullable: false })
  currencyCode: string;

  @ApiProperty({ description: 'Organization ID', example: 'd290f1ee-6c54-4b01-90e6-d701748f0851' })
  @Column({ name: 'organization_id', type: 'uuid', nullable: true })
  organizationId?: string | null;

  @ApiProperty({ description: 'Exchange rate', example: 1.0 })
  @Column({ name: 'rate', type: 'double precision', nullable: false })
  rate: number;

  @ApiProperty({ description: 'Currency symbol', example: 'BDT' })
  @Column({ name: 'symbol', nullable: false })
  symbol: string;

  @ApiProperty({ description: 'Default currency flag', example: true })
  @Column({ name: 'is_default', type: 'boolean', default: false, nullable: false })
  isDefault: boolean;

  @ApiProperty({ description: 'Active status', example: true })
  @Column({ name: 'is_active', type: 'boolean', default: true, nullable: false })
  isActive: boolean;

  @ApiProperty({ description: 'Organization', type: () => Organization, required: false })
  @ManyToOne(() => Organization, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organization_id' })
  organization?: Organization | null;
}
