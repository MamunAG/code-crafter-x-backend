import { ApiProperty } from '@nestjs/swagger';
import { Organization } from 'src/app-configuration/organization/entity/organization.entity';
import { Country } from 'src/app-configuration/country/entity/country.entity';
import { BaseEntity } from 'src/common/entities/base.entity';
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

@Entity('buyer')
export class Buyer extends BaseEntity {
  @ApiProperty({ description: 'Primary ID' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Buyer name', example: 'ABC Trading Ltd.' })
  @Column({ name: 'name', nullable: false })
  name: string;

  @ApiProperty({ description: 'Buyer display name', example: 'ABC Trading' })
  @Column({ name: 'display_name', nullable: false })
  displayName: string;

  @ApiProperty({ description: 'Buyer contact number', example: '+8801712345678', required: false, nullable: true })
  @Column({ name: 'contact', nullable: true })
  contact?: string | null;

  @ApiProperty({ description: 'Buyer email', example: 'buyer@example.com', required: false, nullable: true })
  @Column({ name: 'email', nullable: true })
  email?: string | null;

  @ApiProperty({ description: 'Country ID', example: 1, required: false, nullable: true })
  @Column({ name: 'country_id', nullable: true })
  countryId?: number | null;

  @ApiProperty({ description: 'Organization ID', example: 'd290f1ee-6c54-4b01-90e6-d701748f0851' })
  @Column({ name: 'organization_id', type: 'uuid', nullable: true })
  organizationId?: string | null;

  @ApiProperty({ description: 'Buyer address', example: 'Dhaka, Bangladesh', required: false, nullable: true })
  @Column({ name: 'address', nullable: true })
  address?: string | null;

  @ApiProperty({ description: 'Buyer remarks', example: 'Preferred export buyer.' })
  @Column({ name: 'remarks', type: 'text', nullable: true })
  remarks?: string | null;

  @ApiProperty({ description: 'Active status', example: true })
  @Column({ name: 'is_active', type: 'boolean', default: true, nullable: false })
  isActive: boolean;

  @ApiProperty({ description: 'Country object', type: () => Country, required: false, nullable: true })
  @ManyToOne(() => Country, { nullable: true })
  @JoinColumn({ name: 'country_id' })
  country?: Country | null;

  @ApiProperty({ description: 'Organization', type: () => Organization, required: false })
  @ManyToOne(() => Organization, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organization_id' })
  organization?: Organization | null;
}
