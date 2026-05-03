import { ApiProperty } from '@nestjs/swagger';
import { Organization } from 'src/app-configuration/organization/entity/organization.entity';
import { BaseEntity } from 'src/common/entities/base.entity';
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

@Entity('factory')
export class Factory extends BaseEntity {
    @ApiProperty({ description: 'Primary ID' })
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ApiProperty({ description: 'Factory name', example: 'ABC Factory Ltd.' })
    @Column({ name: 'name', nullable: false })
    name: string;

    @ApiProperty({ description: 'Factory display name', example: 'ABC Factory' })
    @Column({ name: 'display_name', nullable: false })
    displayName: string;

    @ApiProperty({ description: 'Factory code', example: 'FAC-001', required: false, nullable: true })
    @Column({ name: 'code', type: 'varchar', nullable: true })
    code?: string | null;

    @ApiProperty({ description: 'Factory contact number', example: '+8801712345678', required: false, nullable: true })
    @Column({ name: 'contact', type: 'varchar', nullable: true })
    contact?: string | null;

    @ApiProperty({ description: 'Factory email', example: 'factory@example.com', required: false, nullable: true })
    @Column({ name: 'email', type: 'varchar', nullable: true })
    email?: string | null;

    @ApiProperty({ description: 'Organization ID', example: 'd290f1ee-6c54-4b01-90e6-d701748f0851' })
    @Column({ name: 'organization_id', type: 'uuid', nullable: true })
    organizationId?: string | null;

    @ApiProperty({ description: 'Factory address', example: 'Dhaka, Bangladesh', required: false, nullable: true })
    @Column({ name: 'address', type: 'varchar', nullable: true })
    address?: string | null;

    @ApiProperty({ description: 'Factory remarks', example: 'Main production factory.' })
    @Column({ name: 'remarks', type: 'text', nullable: true })
    remarks?: string | null;

    @ApiProperty({ description: 'Active status', example: true })
    @Column({ name: 'is_active', type: 'boolean', default: true, nullable: false })
    isActive: boolean;

    @ApiProperty({ description: 'Organization', type: () => Organization, required: false })
    @ManyToOne(() => Organization, { nullable: true, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'organization_id' })
    organization?: Organization | null;
}