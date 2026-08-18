import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PaginatedResponseDto } from 'src/common/dto/paginated-response.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { Files } from 'src/files/entities/file.entity';
import { Repository } from 'typeorm';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { FilterEmployeeDto } from './dto/filter-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { Employee } from './entity/employee.entity';
import { Factory } from 'src/app-configuration/factory/entity/factory.entity';
import { Department } from 'src/hr-payroll/master-data/department/entity/department.entity';
import { Designation } from 'src/hr-payroll/master-data/designation/entity/designation.entity';
import { Gender } from './dto/gender.enum';
import { HrAuditEvent, HrMasterData } from '../common/entity';
import { HrMasterDataType } from '../common/hr.enums';

@Injectable()
export class EmployeeService {
    constructor(
        @InjectRepository(Employee)
        private employeeRepository: Repository<Employee>,

        @InjectRepository(Factory)
        private factoryRepository: Repository<Factory>,

        @InjectRepository(Department)
        private departmentRepository: Repository<Department>,

        @InjectRepository(Designation)
        private designationRepository: Repository<Designation>,

        @InjectRepository(Files)
        private filesRepository: Repository<Files>,

        @InjectRepository(HrAuditEvent)
        private auditRepository: Repository<HrAuditEvent>,

        @InjectRepository(HrMasterData)
        private hrMasterDataRepository: Repository<HrMasterData>,
    ) { }

    auditPiiAccess(organizationId: string, userId: string, subjectId: string, metadata: Record<string, unknown> = {}) {
        return this.auditRepository.save(this.auditRepository.create({ organizationId, actorId: userId, action: 'VIEW_PII', subjectType: 'Employee', subjectId, metadata }));
    }

    async create(dto: CreateEmployeeDto, organizationId: string) {
        const factory = await this.findFactoryOrFail(dto.factoryId, organizationId);
        await this.validateExtendedReferences(dto, organizationId);
        await this.ensureEmployeeCodeIsUnique(dto.employeeCode, dto.factoryId, organizationId);
        const image = dto.imageId != null ? await this.findFileOrFail(dto.imageId) : null;

        const employee = this.employeeRepository.create({
            ...dto,
            organizationId,
            factory,
            image: image ?? undefined,
        });

        const saved = await this.employeeRepository.save(employee);
        return this.findOne(saved.id, organizationId);
    }

    async findAll(
        paginationDto: PaginationDto,
        filters?: Partial<FilterEmployeeDto>,
        organizationId?: string,
    ): Promise<PaginatedResponseDto<Employee>> {
        const { page = 1, limit = 1000000000000 } = paginationDto;
        const skip = (page - 1) * limit;
        const deletedOnly = filters?.deletedOnly === true || filters?.deletedOnly === 'true';

        const queryBuilder = this.employeeRepository
            .createQueryBuilder('employee')
            .leftJoinAndSelect('employee.factory', 'factory')
            .leftJoinAndSelect('employee.organization', 'organization')
            .leftJoinAndSelect('employee.created_by_user', 'created_by_user')
            .leftJoinAndSelect('employee.updated_by_user', 'updated_by_user')
            .leftJoinAndSelect('employee.deleted_by_user', 'deleted_by_user')
            .leftJoinAndSelect('employee.designation', 'designation')
            .leftJoinAndSelect('employee.department', 'department')
            .leftJoinAndSelect('employee.image', 'image')
            .where('employee.organization_id = :organizationId', { organizationId })
            .skip(skip)
            .take(limit)
            .orderBy('employee.created_at', 'DESC');

        if (deletedOnly) {
            queryBuilder.withDeleted().andWhere('employee.deleted_at IS NOT NULL');
        } else {
            queryBuilder.andWhere('employee.deleted_at IS NULL');
        }

        if (filters?.factoryId) {
            queryBuilder.andWhere('employee.factoryId = :factoryId', { factoryId: filters.factoryId });
        }

        if (filters?.employeeCode) {
            queryBuilder.andWhere('employee.employeeCode ILIKE :employeeCode', {
                employeeCode: `%${filters.employeeCode}%`,
            });
        }

        if (filters?.employeeName) {
            queryBuilder.andWhere('employee.employeeName ILIKE :employeeName', {
                employeeName: `%${filters.employeeName}%`,
            });
        }

        if (filters?.designationId) {
            queryBuilder.andWhere('employee.designation_id = :designationId', {
                designationId: filters.designationId,
            });
        }

        if (filters?.departmentId) {
            queryBuilder.andWhere('employee.department_id = :departmentId', {
                departmentId: filters.departmentId,
            });
        }

        if (filters?.gender) {
            queryBuilder.andWhere('employee.gender = :gender', {
                gender: filters.gender,
            });
        }

        if (filters?.isActive !== undefined && filters.isActive !== '') {
            queryBuilder.andWhere('employee.isActive = :isActive', {
                isActive: filters.isActive === 'true',
            });
        }

        const [items, total] = await queryBuilder.getManyAndCount();
        const totalPages = Math.ceil(total / limit);

        return {
            items,
            meta: {
                total,
                page,
                limit,
                totalPages,
                hasNextPage: page < totalPages,
                hasPreviousPage: page > 1,
            },
        };
    }

    async findOne(id: string, organizationId: string) {
        const employee = await this.employeeRepository
            .createQueryBuilder('employee')
            .leftJoinAndSelect('employee.factory', 'factory')
            .leftJoinAndSelect('employee.organization', 'organization')
            .leftJoinAndSelect('employee.created_by_user', 'created_by_user')
            .leftJoinAndSelect('employee.updated_by_user', 'updated_by_user')
            .leftJoinAndSelect('employee.designation', 'designation')
            .leftJoinAndSelect('employee.department', 'department')
            .leftJoinAndSelect('employee.image', 'image')
            .where('employee.id = :id', { id })
            .andWhere('employee.organization_id = :organizationId', { organizationId })
            .andWhere('employee.deleted_at IS NULL')
            .getOne();

        if (!employee) {
            throw new NotFoundException('Employee not found in the selected organization.');
        }

        return employee;
    }

    async update(id: string, dto: UpdateEmployeeDto, organizationId: string) {
        const employee = await this.ensureEmployeeExists(id, organizationId);
        await this.validateExtendedReferences(dto, organizationId);

        if (dto.factoryId !== undefined) {
            employee.factory = await this.findFactoryOrFail(dto.factoryId, organizationId);
            employee.factoryId = dto.factoryId;
        }

        if (dto.imageId === null) {
            employee.image = null;
            employee.imageId = null;
        } else if (dto.imageId !== undefined) {
            employee.image = await this.findFileOrFail(dto.imageId);
            employee.imageId = dto.imageId;
        }

        if (dto.employeeCode) {
            await this.ensureEmployeeCodeIsUnique(
                dto.employeeCode,
                dto.factoryId ?? employee.factoryId,
                organizationId,
                id,
            );
        }

        Object.assign(employee, dto);

        const saved = await this.employeeRepository.save(employee);
        return this.findOne(saved.id, organizationId);
    }

    async remove(id: string, deletedById: string, organizationId: string) {
        await this.ensureEmployeeExists(id, organizationId);
        await this.employeeRepository.update({ id, organizationId }, { deleted_by_id: deletedById });
        return this.employeeRepository.softDelete({ id, organizationId });
    }

    async permanentRemove(id: string, organizationId: string) {
        await this.ensureEmployeeExists(id, organizationId, true);
        return this.employeeRepository.delete({ id, organizationId });
    }

    async restore(id: string, organizationId: string) {
        await this.ensureEmployeeExists(id, organizationId, true);
        return this.employeeRepository.restore({ id, organizationId });
    }

    buildUploadTemplate() {
        return [
            'factoryName,employeeCode,employeeName,designationName,departmentName,phoneNo,email,gender,joiningDate,nidNo,address,remarks,isActive',
            'Main Factory,EMP-001,Abdur Rahman,Operator,Sewing,+8801700000000,employee@example.com,Male,2026-05-03,1234567890,"Dhaka, Bangladesh",Permanent employee,true',
        ].join('\n');
    }

    async importFromTemplate(file: Express.Multer.File | undefined, userId: string, organizationId: string) {
        if (!file?.buffer?.length) {
            throw new BadRequestException('Please upload a CSV template file.');
        }

        const rows = this.parseEmployeeTemplate(file.buffer.toString('utf8'));

        if (!rows.length) {
            return {
                inserted: 0,
                skipped: 0,
            };
        }

        const [factories, designations, departments] = await Promise.all([
            this.factoryRepository
                .createQueryBuilder('factory')
                .select(['factory.id', 'factory.name', 'factory.displayName', 'factory.code'])
                .where('factory.organization_id = :organizationId', { organizationId })
                .andWhere('factory.deleted_at IS NULL')
                .andWhere('factory.is_active = :isActive', { isActive: true })
                .getMany(),
            this.designationRepository
                .createQueryBuilder('designation')
                .select(['designation.id', 'designation.designationName'])
                .where('designation.organization_id = :organizationId', { organizationId })
                .andWhere('designation.deleted_at IS NULL')
                .andWhere('designation.is_active = :isActive', { isActive: true })
                .getMany(),
            this.departmentRepository
                .createQueryBuilder('department')
                .select(['department.id', 'department.departmentName'])
                .where('department.organization_id = :organizationId', { organizationId })
                .andWhere('department.deleted_at IS NULL')
                .andWhere('department.is_active = :isActive', { isActive: true })
                .getMany(),
        ]);

        const factoryIdByName = new Map<string, string>();
        for (const factory of factories) {
            [factory.name, factory.displayName, factory.code]
                .map((value) => value?.trim().toLowerCase())
                .filter((value): value is string => Boolean(value))
                .forEach((value) => factoryIdByName.set(value, factory.id));
        }

        const designationIdByName = new Map(
            designations
                .map((designation) => [designation.designationName?.trim().toLowerCase(), designation.id] as const)
                .filter((entry): entry is readonly [string, string] => Boolean(entry[0])),
        );
        const departmentIdByName = new Map(
            departments
                .map((department) => [department.departmentName?.trim().toLowerCase(), department.id] as const)
                .filter((entry): entry is readonly [string, string] => Boolean(entry[0])),
        );

        const missingFactories = new Set<string>();
        const missingDesignations = new Set<string>();
        const missingDepartments = new Set<string>();
        let missingRequiredRows = 0;
        let invalidJoiningDateRows = 0;
        const filteredRows = rows.flatMap((row) => {
            const factoryId = this.resolveLookupName(row.factoryName, factoryIdByName);
            const designationId = this.resolveLookupName(row.designationName, designationIdByName);
            const departmentId = this.resolveLookupName(row.departmentName, departmentIdByName);
            const joiningDate = this.parseOptionalDate(row.joiningDate);
            let hasMissingSetup = false;

            if (row.factoryName && !factoryId) {
                missingFactories.add(row.factoryName);
                hasMissingSetup = true;
            }

            if (row.designationName && !designationId) {
                missingDesignations.add(row.designationName);
                hasMissingSetup = true;
            }

            if (row.departmentName && !departmentId) {
                missingDepartments.add(row.departmentName);
                hasMissingSetup = true;
            }

            if (!row.employeeCode || !row.employeeName || (!factoryId && !hasMissingSetup)) {
                missingRequiredRows += 1;
                return [];
            }

            if (hasMissingSetup || !factoryId) {
                return [];
            }

            if (row.joiningDate && !joiningDate) {
                invalidJoiningDateRows += 1;
                return [];
            }

            return [
                {
                    ...row,
                    factoryId,
                    designationId,
                    departmentId,
                    joiningDate,
                },
            ];
        });

        this.throwMissingSetupError(missingFactories, missingDepartments, missingDesignations, rows.length);

        const existingEmployees = filteredRows.length
            ? await this.employeeRepository
                .createQueryBuilder('employee')
                .withDeleted()
                .select(['employee.employeeCode', 'employee.factoryId'])
                .where('employee.organization_id = :organizationId', { organizationId })
                .andWhere('employee.factory_id IN (:...factoryIds)', {
                    factoryIds: [...new Set(filteredRows.map((row) => row.factoryId))],
                })
                .getMany()
            : [];

        const existingKeySet = new Set(
            existingEmployees.map((employee) =>
                `${employee.factoryId}:${employee.employeeCode.trim().toLowerCase()}`,
            ),
        );
        const seenKeySet = new Set<string>();
        const duplicateEmployees = new Set<string>();
        const employeesToCreate = filteredRows
            .filter((row) => {
                const key = `${row.factoryId}:${row.employeeCode.trim().toLowerCase()}`;

                if (existingKeySet.has(key) || seenKeySet.has(key)) {
                    duplicateEmployees.add(`${row.factoryName} / ${row.employeeCode}`);
                    return false;
                }

                seenKeySet.add(key);
                return true;
            })
            .map((row) =>
                this.employeeRepository.create({
                    factoryId: row.factoryId,
                    employeeCode: row.employeeCode,
                    employeeName: row.employeeName,
                    designationId: row.designationId ?? undefined,
                    departmentId: row.departmentId ?? undefined,
                    phoneNo: row.phoneNo ?? undefined,
                    email: row.email ?? undefined,
                    gender: row.gender ?? undefined,
                    joiningDate: row.joiningDate ? new Date(row.joiningDate) : undefined,
                    nidNo: row.nidNo ?? undefined,
                    address: row.address ?? undefined,
                    remarks: row.remarks ?? undefined,
                    isActive: row.isActive,
                    organizationId,
                    created_by_id: userId,
                    updated_by_id: null as unknown as string,
                    updated_at: null as unknown as Date,
                }),
            );

        if (!employeesToCreate.length) {
            return {
                inserted: 0,
                skipped: rows.length,
                skippedReasons: {
                    duplicateEmployees: [...duplicateEmployees],
                    missingRequiredRows,
                    invalidJoiningDateRows,
                },
            };
        }

        const savedEmployees = await this.employeeRepository.save(employeesToCreate);

        return {
            inserted: savedEmployees.length,
            skipped: rows.length - savedEmployees.length,
            skippedReasons: {
                duplicateEmployees: [...duplicateEmployees],
                missingRequiredRows,
                invalidJoiningDateRows,
            },
        };
    }

    private async validateExtendedReferences(dto: Partial<CreateEmployeeDto>, organizationId: string) {
        const masterReferences: Array<[string | undefined, HrMasterDataType, string]> = [
            [dto.employmentTypeId, HrMasterDataType.EmploymentType, 'Employment type'],
            [dto.gradeId, HrMasterDataType.Grade, 'Grade'],
            [dto.payGroupId, HrMasterDataType.PayGroup, 'Pay group'],
            [dto.workLocationId, HrMasterDataType.WorkLocation, 'Work location'],
        ];
        for (const [id, type, label] of masterReferences) {
            if (!id) continue;
            const item = await this.hrMasterDataRepository.findOne({ where: { id, organizationId, type, isActive: true } });
            if (!item) throw new BadRequestException(`${label} not found in the selected organization.`);
        }
        if (dto.supervisorId) {
            const supervisor = await this.employeeRepository.findOne({ where: { id: dto.supervisorId, organizationId, isActive: true } });
            if (!supervisor) throw new BadRequestException('Active supervisor not found in the selected organization.');
        }
    }

    private async findFactoryOrFail(factoryId: string, organizationId: string) {
        const factory = await this.factoryRepository.findOne({
            where: { id: factoryId, organizationId },
        });

        if (!factory) {
            throw new BadRequestException('Factory not found in the selected organization.');
        }

        return factory;
    }

    private async findFileOrFail(fileId: number) {
        const file = await this.filesRepository.findOne({
            where: { id: fileId },
        });

        if (!file) {
            throw new BadRequestException('Image not found.');
        }

        return file;
    }

    private async ensureEmployeeCodeIsUnique(
        employeeCode: string,
        factoryId: string,
        organizationId: string,
        ignoreId?: string,
    ) {
        const queryBuilder = this.employeeRepository
            .createQueryBuilder('employee')
            .where('LOWER(TRIM(employee.employeeCode)) = :employeeCode', {
                employeeCode: employeeCode.trim().toLowerCase(),
            })
            .andWhere('employee.factory_id = :factoryId', { factoryId })
            .andWhere('employee.organization_id = :organizationId', { organizationId })
            .andWhere('employee.deleted_at IS NULL');

        if (ignoreId) {
            queryBuilder.andWhere('employee.id != :ignoreId', { ignoreId });
        }

        const existing = await queryBuilder.getOne();

        if (existing) {
            throw new BadRequestException('Employee code already exists in this factory.');
        }
    }

    private async ensureEmployeeExists(id: string, organizationId: string, includeDeleted = false) {
        const queryBuilder = this.employeeRepository
            .createQueryBuilder('employee')
            .where('employee.id = :id', { id })
            .andWhere('employee.organization_id = :organizationId', { organizationId });

        if (includeDeleted) {
            queryBuilder.withDeleted();
        } else {
            queryBuilder.andWhere('employee.deleted_at IS NULL');
        }

        const employee = await queryBuilder.getOne();

        if (!employee) {
            throw new NotFoundException('Employee not found in the selected organization.');
        }

        return employee;
    }

    private parseEmployeeTemplate(content: string) {
        const lines = content
            .replace(/^\uFEFF/, '')
            .split(/\r?\n/)
            .map((line) => line.trim())
            .filter(Boolean);

        if (lines.length === 0) {
            throw new BadRequestException('The uploaded template does not contain any employee rows.');
        }

        if (lines.length === 1) {
            return [];
        }

        const headers = this.parseCsvLine(lines[0]).map((header) => header.trim().toLowerCase());
        const factoryNameIndex = headers.indexOf('factoryname');
        const employeeCodeIndex = headers.indexOf('employeecode');
        const employeeNameIndex = headers.indexOf('employeename');
        const designationNameIndex = headers.indexOf('designationname');
        const departmentNameIndex = headers.indexOf('departmentname');
        const phoneNoIndex = headers.indexOf('phoneno');
        const emailIndex = headers.indexOf('email');
        const genderIndex = headers.indexOf('gender');
        const joiningDateIndex = headers.indexOf('joiningdate');
        const nidNoIndex = headers.indexOf('nidno');
        const addressIndex = headers.indexOf('address');
        const remarksIndex = headers.indexOf('remarks');
        const isActiveIndex = headers.indexOf('isactive');

        if (factoryNameIndex === -1 || employeeCodeIndex === -1 || employeeNameIndex === -1 || isActiveIndex === -1) {
            throw new BadRequestException('The uploaded template must include factoryName, employeeCode, employeeName, and isActive columns.');
        }

        return lines.slice(1).map((line) => {
            const columns = this.parseCsvLine(line);
            const factoryName = factoryNameIndex === -1 ? '' : columns[factoryNameIndex]?.trim() ?? '';
            const employeeCode = columns[employeeCodeIndex]?.trim() ?? '';
            const employeeName = columns[employeeNameIndex]?.trim() ?? '';
            const designationName = designationNameIndex === -1 ? null : columns[designationNameIndex]?.trim() || null;
            const departmentName = departmentNameIndex === -1 ? null : columns[departmentNameIndex]?.trim() || null;
            const gender = genderIndex === -1 ? null : this.parseGender(columns[genderIndex]);

            return {
                factoryName,
                employeeCode,
                employeeName,
                designationName,
                departmentName,
                phoneNo: phoneNoIndex === -1 ? null : columns[phoneNoIndex]?.trim() || null,
                email: emailIndex === -1 ? null : columns[emailIndex]?.trim()?.toLowerCase() || null,
                gender,
                joiningDate: joiningDateIndex === -1 ? null : columns[joiningDateIndex]?.trim() || null,
                nidNo: nidNoIndex === -1 ? null : columns[nidNoIndex]?.trim() || null,
                address: addressIndex === -1 ? null : columns[addressIndex]?.trim() || null,
                remarks: remarksIndex === -1 ? null : columns[remarksIndex]?.trim() || null,
                isActive: this.parseBoolean(columns[isActiveIndex]),
            };
        });
    }

    private parseCsvLine(line: string) {
        const values: string[] = [];
        let current = '';
        let inQuotes = false;

        for (let index = 0; index < line.length; index += 1) {
            const character = line[index];
            const nextCharacter = line[index + 1];

            if (character === '"' && nextCharacter === '"') {
                current += '"';
                index += 1;
                continue;
            }

            if (character === '"') {
                inQuotes = !inQuotes;
                continue;
            }

            if (character === ',' && !inQuotes) {
                values.push(current);
                current = '';
                continue;
            }

            current += character;
        }

        values.push(current);
        return values;
    }

    private parseBoolean(value: boolean | string | null | undefined) {
        if (typeof value === 'boolean') {
            return value;
        }

        const normalizedValue = value?.trim().toLowerCase();
        if (!normalizedValue) {
            return true;
        }

        return ['true', 'yes', 'y', '1', 'active'].includes(normalizedValue);
    }

    private parseGender(value: string | null | undefined) {
        const normalizedValue = value?.trim();

        if (!normalizedValue) {
            return null;
        }

        return Object.values(Gender).includes(normalizedValue as Gender) ? normalizedValue as Gender : null;
    }

    private resolveLookupName(name: string | null | undefined, idByName: Map<string, string>) {
        const normalizedName = name?.trim().toLowerCase() ?? '';
        return normalizedName ? idByName.get(normalizedName) ?? null : null;
    }

    private throwMissingSetupError(
        factories: Set<string>,
        departments: Set<string>,
        designations: Set<string>,
        totalRows: number,
    ) {
        const missing = {
            factories: [...factories],
            departments: [...departments],
            designations: [...designations],
        };

        if (!missing.factories.length && !missing.departments.length && !missing.designations.length) {
            return;
        }

        throw new BadRequestException({
            message: 'Employee upload could not be completed because required setup data is missing. Please add the missing setup records first, then upload the template again.',
            uploadReport: {
                inserted: 0,
                skipped: totalRows,
                missing,
            },
        });
    }

    private parseOptionalDate(value: string | null | undefined) {
        const trimmedValue = value?.trim() ?? '';

        if (!trimmedValue) {
            return null;
        }

        const date = new Date(trimmedValue);
        return Number.isNaN(date.getTime()) ? null : trimmedValue;
    }
}
