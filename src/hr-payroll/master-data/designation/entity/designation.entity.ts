import { ApiProperty } from '@nestjs/swagger';
import { Organization } from 'src/app-configuration/organization/entity/organization.entity';
import { BaseEntity } from 'src/common/entities/base.entity';
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

@Entity('hr-designations')
export class Designation extends BaseEntity {
    @ApiProperty({ description: 'Primary ID' })
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ApiProperty({ description: 'Organization ID', example: 'uuid' })
    @Column({ name: 'organization_id', type: 'uuid', nullable: false })
    organizationId: string;

    @ApiProperty({ description: 'Designation name', example: 'Operator' })
    @Column({ name: 'designation_name', type: 'varchar', length: 255, nullable: false })
    designationName: string;

    @ApiProperty({ description: 'Description', example: 'Machine operator' })
    @Column({ name: 'description', type: 'text', nullable: true })
    description?: string;

    @ApiProperty({ description: 'Active status', example: true })
    @Column({ name: 'is_active', type: 'boolean', default: true })
    isActive: boolean;

    @ApiProperty({ description: 'Organization object', type: () => Organization })
    @ManyToOne(() => Organization, { nullable: false })
    @JoinColumn({ name: 'organization_id' })
    organization: Organization;
}