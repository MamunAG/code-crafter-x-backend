import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { PaginatedResponseDto } from 'src/common/dto/paginated-response.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { FilterOrganizationDto } from './dto/filter-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { Organization } from './entity/organization.entity';

@Injectable()
export class OrganizationService {
  constructor(
    @InjectRepository(Organization)
    private organizationRepository: Repository<Organization>,
  ) {}

  async create(organizationDto: CreateOrganizationDto) {
    await this.ensureNameIsUnique(organizationDto.name);
    const organization = this.organizationRepository.create(organizationDto);
    const saved = await this.organizationRepository.save(organization);
    return this.findOne(saved.id);
  }

  async findAll(
    paginationDto: PaginationDto,
    filters?: Partial<FilterOrganizationDto>,
  ): Promise<PaginatedResponseDto<Organization>> {
    const { page = 1, limit = 1000000000000 } = paginationDto;
    const deletedOnly = filters?.deletedOnly ?? false;
    const skip = (page - 1) * limit;

    const queryBuilder = this.organizationRepository
      .createQueryBuilder('organization')
      .leftJoinAndSelect('organization.created_by_user', 'created_by_user')
      .leftJoinAndSelect('organization.updated_by_user', 'updated_by_user')
      .leftJoinAndSelect('organization.deleted_by_user', 'deleted_by_user')
      .skip(skip)
      .take(limit)
      .orderBy(deletedOnly ? 'organization.deleted_at' : 'organization.created_at', 'DESC');

    if (deletedOnly) {
      queryBuilder.withDeleted();
    }

    if (filters?.name) {
      queryBuilder.andWhere('organization.name ILIKE :name', {
        name: `%${filters.name}%`,
      });
    }

    if (filters?.address) {
      queryBuilder.andWhere('organization.address ILIKE :address', {
        address: `%${filters.address}%`,
      });
    }

    if (filters?.contact) {
      queryBuilder.andWhere('organization.contact ILIKE :contact', {
        contact: `%${filters.contact}%`,
      });
    }

    if (deletedOnly) {
      queryBuilder.andWhere('organization.deleted_at IS NOT NULL');
    } else {
      queryBuilder.andWhere('organization.deleted_at IS NULL');
    }

    const [items, total] = await queryBuilder.getManyAndCount();
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    return {
      items,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage,
        hasPreviousPage,
      },
    };
  }

  findOne(id: string) {
    return this.organizationRepository
      .createQueryBuilder('organization')
      .leftJoinAndSelect('organization.created_by_user', 'created_by_user')
      .leftJoinAndSelect('organization.updated_by_user', 'updated_by_user')
      .leftJoinAndSelect('organization.deleted_by_user', 'deleted_by_user')
      .where('organization.id = :id', { id })
      .andWhere('organization.deleted_at IS NULL')
      .getOne();
  }

  async update(id: string, dto: UpdateOrganizationDto) {
    await this.ensureNameIsUnique(dto.name, id);
    await this.organizationRepository.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: string, deletedById: string) {
    await this.organizationRepository.update(id, { deleted_by_id: deletedById });
    return this.organizationRepository.softDelete(id);
  }

  permanentRemove(id: string) {
    return this.organizationRepository.delete(id);
  }

  restore(id: string) {
    return this.organizationRepository.restore(id);
  }

  private async ensureNameIsUnique(name: string, ignoreId?: string) {
    const normalizedName = name.trim().toLowerCase();

    const queryBuilder = this.organizationRepository
      .createQueryBuilder('organization')
      .where('LOWER(TRIM(organization.name)) = :name', { name: normalizedName })
      .andWhere('organization.deleted_at IS NULL');

    if (ignoreId !== undefined) {
      queryBuilder.andWhere('organization.id != :ignoreId', { ignoreId });
    }

    const existing = await queryBuilder.getOne();

    if (existing) {
      throw new BadRequestException('Organization already exists');
    }
  }
}
