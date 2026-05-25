import { ApiProperty } from '@nestjs/swagger';
import { Organization } from 'src/app-configuration/organization/entity/organization.entity';
import { BaseEntity } from 'src/common/entities/base.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('material')
export class Material extends BaseEntity {
  @ApiProperty({ description: 'Primary ID' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Material name', example: 'Cotton Fabric' })
  @Column({ name: 'name', nullable: false })
  name: string;

  @ApiProperty({
    description: 'Material code',
    example: 'MAT-001',
    required: false,
    nullable: true,
  })
  @Column({ name: 'code', type: 'varchar', nullable: true })
  code?: string | null;

  @ApiProperty({
    description: 'Material description',
    example: '100% cotton single jersey fabric',
    required: false,
    nullable: true,
  })
  @Column({ name: 'description', type: 'text', nullable: true })
  description?: string | null;

  @ApiProperty({
    description: 'Material remarks',
    example: 'Preferred for summer programs.',
    required: false,
    nullable: true,
  })
  @Column({ name: 'remarks', type: 'text', nullable: true })
  remarks?: string | null;

  @ApiProperty({
    description: 'Organization ID',
    example: 'd290f1ee-6c54-4b01-90e6-d701748f0851',
  })
  @Column({ name: 'organization_id', type: 'uuid', nullable: true })
  organizationId?: string | null;

  @ApiProperty({ description: 'Active status', example: true })
  @Column({
    name: 'is_active',
    type: 'boolean',
    default: true,
    nullable: false,
  })
  isActive: boolean;

  @ApiProperty({
    description: 'Organization',
    type: () => Organization,
    required: false,
  })
  @ManyToOne(() => Organization, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organization_id' })
  organization?: Organization | null;
}
