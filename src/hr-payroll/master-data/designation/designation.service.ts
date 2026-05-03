import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PaginatedResponseDto } from 'src/common/dto/paginated-response.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { Repository } from 'typeorm';
import { CreateDesignationDto } from './dto/create-designation.dto';
import { FilterDesignationDto } from './dto/filter-designation.dto';
import { UpdateDesignationDto } from './dto/update-designation.dto';
import { Designation } from './entity/designation.entity';

@Injectable()
export class DesignationService {
    constructor(
        @InjectRepository(Designation)
        private designationRepository: Repository<Designation>,
    ) { }

    async create(dto: CreateDesignationDto, organizationId: string) {
        await this.ensureDesignationNameIsUnique(dto.designationName, organizationId);

        const designation = this.designationRepository.create({
            ...dto,
            organizationId,
        });

        const saved = await this.designationRepository.save(designation);
        return this.findOne(saved.id, organizationId);
    }

    async findAll(
        paginationDto: PaginationDto,
        filters?: Partial<FilterDesignationDto>,
        organizationId?: string,
    ): Promise<PaginatedResponseDto<Designation>> {
        const { page = 1, limit = 1000000000000 } = paginationDto;
        const skip = (page - 1) * limit;
        const deletedOnly = filters?.deletedOnly === true || filters?.deletedOnly === 'true';

        const queryBuilder = this.designationRepository
            .createQueryBuilder('designation')
            .leftJoinAndSelect('designation.organization', 'organization')
            .leftJoinAndSelect('designation.created_by_user', 'created_by_user')
            .leftJoinAndSelect('designation.updated_by_user', 'updated_by_user')
            .leftJoinAndSelect('designation.deleted_by_user', 'deleted_by_user')
            .where('designation.organization_id = :organizationId', { organizationId })
            .skip(skip)
            .take(limit)
            .orderBy('designation.created_at', 'DESC');

        if (deletedOnly) {
            queryBuilder.withDeleted().andWhere('designation.deleted_at IS NOT NULL');
        } else {
            queryBuilder.andWhere('designation.deleted_at IS NULL');
        }

        if (filters?.designationName) {
            queryBuilder.andWhere('designation.designationName ILIKE :designationName', {
                designationName: `%${filters.designationName}%`,
            });
        }

        if (filters?.isActive !== undefined && filters.isActive !== '') {
            queryBuilder.andWhere('designation.isActive = :isActive', {
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
        const designation = await this.designationRepository
            .createQueryBuilder('designation')
            .leftJoinAndSelect('designation.organization', 'organization')
            .leftJoinAndSelect('designation.created_by_user', 'created_by_user')
            .leftJoinAndSelect('designation.updated_by_user', 'updated_by_user')
            .where('designation.id = :id', { id })
            .andWhere('designation.organization_id = :organizationId', { organizationId })
            .andWhere('designation.deleted_at IS NULL')
            .getOne();

        if (!designation) {
            throw new NotFoundException('Designation not found in the selected organization.');
        }

        return designation;
    }

    async update(id: string, dto: UpdateDesignationDto, organizationId: string) {
        const designation = await this.ensureDesignationExists(id, organizationId);

        if (dto.designationName) {
            await this.ensureDesignationNameIsUnique(dto.designationName, organizationId, id);
        }

        Object.assign(designation, dto);

        const saved = await this.designationRepository.save(designation);
        return this.findOne(saved.id, organizationId);
    }

    async remove(id: string, deletedById: string, organizationId: string) {
        await this.ensureDesignationExists(id, organizationId);
        await this.designationRepository.update({ id, organizationId }, { deleted_by_id: deletedById });
        return this.designationRepository.softDelete({ id, organizationId });
    }

    async permanentRemove(id: string, organizationId: string) {
        await this.ensureDesignationExists(id, organizationId, true);
        return this.designationRepository.delete({ id, organizationId });
    }

    async restore(id: string, organizationId: string) {
        await this.ensureDesignationExists(id, organizationId, true);
        return this.designationRepository.restore({ id, organizationId });
    }

    private async ensureDesignationNameIsUnique(designationName: string, organizationId: string, ignoreId?: string) {
        const queryBuilder = this.designationRepository
            .createQueryBuilder('designation')
            .where('LOWER(TRIM(designation.designationName)) = :designationName', {
                designationName: designationName.trim().toLowerCase(),
            })
            .andWhere('designation.organization_id = :organizationId', { organizationId })
            .andWhere('designation.deleted_at IS NULL');

        if (ignoreId) {
            queryBuilder.andWhere('designation.id != :ignoreId', { ignoreId });
        }

        const existing = await queryBuilder.getOne();

        if (existing) {
            throw new BadRequestException('Designation already exists.');
        }
    }

    private async ensureDesignationExists(id: string, organizationId: string, includeDeleted = false) {
        const queryBuilder = this.designationRepository
            .createQueryBuilder('designation')
            .where('designation.id = :id', { id })
            .andWhere('designation.organization_id = :organizationId', { organizationId });

        if (includeDeleted) {
            queryBuilder.withDeleted();
        } else {
            queryBuilder.andWhere('designation.deleted_at IS NULL');
        }

        const designation = await queryBuilder.getOne();

        if (!designation) {
            throw new NotFoundException('Designation not found in the selected organization.');
        }

        return designation;
    }
}