import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PaginatedResponseDto } from 'src/common/dto/paginated-response.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { Repository } from 'typeorm';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { FilterDepartmentDto } from './dto/filter-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { Department } from './entity/department.entity';

@Injectable()
export class DepartmentService {
    constructor(
        @InjectRepository(Department)
        private departmentRepository: Repository<Department>,
    ) { }

    async create(dto: CreateDepartmentDto, organizationId: string) {
        await this.ensureDepartmentNameIsUnique(dto.departmentName, organizationId);

        const department = this.departmentRepository.create({
            ...dto,
            organizationId,
        });

        const saved = await this.departmentRepository.save(department);
        return this.findOne(saved.id, organizationId);
    }

    async findAll(
        paginationDto: PaginationDto,
        filters?: Partial<FilterDepartmentDto>,
        organizationId?: string,
    ): Promise<PaginatedResponseDto<Department>> {
        const { page = 1, limit = 1000000000000 } = paginationDto;
        const skip = (page - 1) * limit;
        const deletedOnly = filters?.deletedOnly === true || filters?.deletedOnly === 'true';

        const queryBuilder = this.departmentRepository
            .createQueryBuilder('department')
            .leftJoinAndSelect('department.organization', 'organization')
            .leftJoinAndSelect('department.created_by_user', 'created_by_user')
            .leftJoinAndSelect('department.updated_by_user', 'updated_by_user')
            .leftJoinAndSelect('department.deleted_by_user', 'deleted_by_user')
            .where('department.organization_id = :organizationId', { organizationId })
            .skip(skip)
            .take(limit)
            .orderBy('department.created_at', 'DESC');

        if (deletedOnly) {
            queryBuilder.withDeleted().andWhere('department.deleted_at IS NOT NULL');
        } else {
            queryBuilder.andWhere('department.deleted_at IS NULL');
        }

        if (filters?.departmentName) {
            queryBuilder.andWhere('department.departmentName ILIKE :departmentName', {
                departmentName: `%${filters.departmentName}%`,
            });
        }

        if (filters?.isActive !== undefined && filters.isActive !== '') {
            queryBuilder.andWhere('department.isActive = :isActive', {
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
        const department = await this.departmentRepository
            .createQueryBuilder('department')
            .leftJoinAndSelect('department.organization', 'organization')
            .leftJoinAndSelect('department.created_by_user', 'created_by_user')
            .leftJoinAndSelect('department.updated_by_user', 'updated_by_user')
            .where('department.id = :id', { id })
            .andWhere('department.organization_id = :organizationId', { organizationId })
            .andWhere('department.deleted_at IS NULL')
            .getOne();

        if (!department) {
            throw new NotFoundException('Department not found in the selected organization.');
        }

        return department;
    }

    async update(id: string, dto: UpdateDepartmentDto, organizationId: string) {
        const department = await this.ensureDepartmentExists(id, organizationId);

        if (dto.departmentName) {
            await this.ensureDepartmentNameIsUnique(dto.departmentName, organizationId, id);
        }

        Object.assign(department, dto);

        const saved = await this.departmentRepository.save(department);
        return this.findOne(saved.id, organizationId);
    }

    async remove(id: string, deletedById: string, organizationId: string) {
        await this.ensureDepartmentExists(id, organizationId);
        await this.departmentRepository.update({ id, organizationId }, { deleted_by_id: deletedById });
        return this.departmentRepository.softDelete({ id, organizationId });
    }

    async permanentRemove(id: string, organizationId: string) {
        await this.ensureDepartmentExists(id, organizationId, true);
        return this.departmentRepository.delete({ id, organizationId });
    }

    async restore(id: string, organizationId: string) {
        await this.ensureDepartmentExists(id, organizationId, true);
        return this.departmentRepository.restore({ id, organizationId });
    }

    private async ensureDepartmentNameIsUnique(departmentName: string, organizationId: string, ignoreId?: string) {
        const queryBuilder = this.departmentRepository
            .createQueryBuilder('department')
            .where('LOWER(TRIM(department.departmentName)) = :departmentName', {
                departmentName: departmentName.trim().toLowerCase(),
            })
            .andWhere('department.organization_id = :organizationId', { organizationId })
            .andWhere('department.deleted_at IS NULL');

        if (ignoreId) {
            queryBuilder.andWhere('department.id != :ignoreId', { ignoreId });
        }

        const existing = await queryBuilder.getOne();

        if (existing) {
            throw new BadRequestException('Department already exists.');
        }
    }

    private async ensureDepartmentExists(id: string, organizationId: string, includeDeleted = false) {
        const queryBuilder = this.departmentRepository
            .createQueryBuilder('department')
            .where('department.id = :id', { id })
            .andWhere('department.organization_id = :organizationId', { organizationId });

        if (includeDeleted) {
            queryBuilder.withDeleted();
        } else {
            queryBuilder.andWhere('department.deleted_at IS NULL');
        }

        const department = await queryBuilder.getOne();

        if (!department) {
            throw new NotFoundException('Department not found in the selected organization.');
        }

        return department;
    }
}