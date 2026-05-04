import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PaginatedResponseDto } from 'src/common/dto/paginated-response.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { Repository } from 'typeorm';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { FilterEmployeeDto } from './dto/filter-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { Employee } from './entity/employee.entity';
import { Factory } from 'src/app-configuration/factory/entity/factory.entity';

@Injectable()
export class EmployeeService {
    constructor(
        @InjectRepository(Employee)
        private employeeRepository: Repository<Employee>,

        @InjectRepository(Factory)
        private factoryRepository: Repository<Factory>,
    ) { }

    async create(dto: CreateEmployeeDto, organizationId: string) {
        const factory = await this.findFactoryOrFail(dto.factoryId, organizationId);
        await this.ensureEmployeeCodeIsUnique(dto.employeeCode, dto.factoryId, organizationId);

        const employee = this.employeeRepository.create({
            ...dto,
            organizationId,
            factory,
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

        if (dto.factoryId !== undefined) {
            employee.factory = await this.findFactoryOrFail(dto.factoryId, organizationId);
            employee.factoryId = dto.factoryId;
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

    private async findFactoryOrFail(factoryId: string, organizationId: string) {
        const factory = await this.factoryRepository.findOne({
            where: { id: factoryId, organizationId },
        });

        if (!factory) {
            throw new BadRequestException('Factory not found in the selected organization.');
        }

        return factory;
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
}