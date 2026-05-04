import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from 'src/common/entities/base.entity';
import { Organization } from 'src/app-configuration/organization/entity/organization.entity';
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Factory } from 'src/app-configuration/factory/entity/factory.entity';
import { Designation } from 'src/hr-payroll/master-data/designation/entity/designation.entity';
import { Department } from 'src/hr-payroll/master-data/department/entity/department.entity';
import { Gender } from '../dto/gender.enum';

@Entity('employees')
export class Employee extends BaseEntity {
    @ApiProperty({ description: 'Primary ID' })
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ApiProperty({ description: 'Factory ID', example: 'uuid' })
    @Column({ name: 'factory_id', type: 'uuid', nullable: false })
    factoryId: string;

    @ApiProperty({ description: 'Organization ID', example: 'uuid' })
    @Column({ name: 'organization_id', type: 'uuid', nullable: false })
    organizationId: string;

    @ApiProperty({ description: 'Employee code', example: 'EMP-001' })
    @Column({ name: 'employee_code', type: 'varchar', length: 100, nullable: false })
    employeeCode: string;

    @ApiProperty({ description: 'Employee name', example: 'Abdur Rahman' })
    @Column({ name: 'employee_name', type: 'varchar', length: 255, nullable: false })
    employeeName: string;

    @ApiProperty({ description: 'Designation ID', example: 'uuid' })
    @Column({ name: 'designation_id', type: 'uuid', nullable: true })
    designationId?: string | null;

    @ApiProperty({ description: 'Department ID', example: 'uuid' })
    @Column({ name: 'department_id', type: 'uuid', nullable: true })
    departmentId?: string | null;

    @ApiProperty({ description: 'Phone number', example: '+8801700000000' })
    @Column({ name: 'phone_no', type: 'varchar', length: 50, nullable: true })
    phoneNo?: string;

    @ApiProperty({ description: 'Email', example: 'employee@example.com' })
    @Column({ name: 'email', type: 'varchar', length: 255, nullable: true })
    email?: string;

    @ApiProperty({ description: 'Gender', enum: Gender, example: Gender.Male, })
    @Column({ name: 'gender', type: 'enum', enum: Gender, nullable: true, })
    gender?: Gender;

    @ApiProperty({ description: 'Joining date', example: '2026-05-03' })
    @Column({ name: 'joining_date', type: 'date', nullable: true })
    joiningDate?: Date;

    @ApiProperty({ description: 'NID / ID card number', example: '1234567890' })
    @Column({ name: 'nid_no', type: 'varchar', length: 100, nullable: true })
    nidNo?: string;

    @ApiProperty({ description: 'Address', example: 'Dhaka, Bangladesh' })
    @Column({ name: 'address', type: 'text', nullable: true })
    address?: string;

    @ApiProperty({ description: 'Remarks', example: 'Permanent employee' })
    @Column({ name: 'remarks', type: 'text', nullable: true })
    remarks?: string;

    @ApiProperty({ description: 'Active status', example: true })
    @Column({ name: 'is_active', type: 'boolean', default: true })
    isActive: boolean;

    @ApiProperty({ description: 'Factory object', type: () => Factory })
    @ManyToOne(() => Factory, { nullable: false })
    @JoinColumn({ name: 'factory_id' })
    factory: Factory;

    @ApiProperty({ description: 'Organization object', type: () => Organization })
    @ManyToOne(() => Organization, { nullable: false })
    @JoinColumn({ name: 'organization_id' })
    organization: Organization;

    @ApiProperty({ description: 'Designation object', type: () => Designation, required: false })
    @ManyToOne(() => Designation, { nullable: true })
    @JoinColumn({ name: 'designation_id' })
    designation?: Designation | null;

    @ApiProperty({ description: 'Department object', type: () => Department, required: false })
    @ManyToOne(() => Department, { nullable: true })
    @JoinColumn({ name: 'department_id' })
    department?: Department | null;
}