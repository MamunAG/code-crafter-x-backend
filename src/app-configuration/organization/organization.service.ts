import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { PaginatedResponseDto } from 'src/common/dto/paginated-response.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { FilterOrganizationDto } from './dto/filter-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { Organization } from './entity/organization.entity';
import { User } from 'src/users/entities/user.entity';
import { UserToOranizationMap } from '../user-to-oranization-map/entity/user-to-oranization-map.entity';
import { RolesEnum } from 'src/common/enums/role.enum';

@Injectable()
export class OrganizationService {
  constructor(
    @InjectDataSource()
    private dataSource: DataSource,

    @InjectRepository(Organization)
    private organizationRepository: Repository<Organization>,
  ) {}

  async create(organizationDto: CreateOrganizationDto, createdById: string) {
    const { savedOrganization, shouldBeDefault } = await this.dataSource.transaction(async (manager) => {
      const userRepository = manager.getRepository(User);
      const organizationRepository = manager.getRepository(Organization);
      const mappingRepository = manager.getRepository(UserToOranizationMap);

      await this.findUserOrFail(userRepository, createdById);

      const organization = organizationRepository.create({
        created_by_id: createdById,
        name: this.normalizeRequiredText(organizationDto.name),
        address: this.normalizeOptionalText(organizationDto.address),
        contact: this.normalizeOptionalText(organizationDto.contact),
      });
      const savedOrganization = await organizationRepository.save(organization);

      const existingMappingsCount = await mappingRepository.count({
        where: {
          userId: createdById,
        },
      });
      const shouldBeDefault = organizationDto.isDefault ?? existingMappingsCount === 0;

      if (shouldBeDefault) {
        await mappingRepository.update(
          {
            userId: createdById,
          },
          {
            isDefault: false,
          },
        );
      }

      const mapping = mappingRepository.create({
        created_by_id: createdById,
        userId: createdById,
        organizationId: savedOrganization.id,
        role: RolesEnum.admin,
        isDefault: shouldBeDefault,
      });

      await mappingRepository.save(mapping);

      return {
        savedOrganization,
        shouldBeDefault,
      };
    });

    return {
      ...this.normalizeUpdatedAt(await this.findOne(savedOrganization.id)),
      isDefault: shouldBeDefault,
    };
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
      items: this.normalizeUpdatedAtList(items),
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
      .getOne()
      .then((organization) => this.normalizeUpdatedAt(organization));
  }

  async update(id: string, dto: UpdateOrganizationDto, updatedById: string) {
    await this.organizationRepository.update(id, {
      updated_by_id: updatedById,
      name: this.normalizeRequiredText(dto.name),
      address: this.normalizeOptionalText(dto.address),
      contact: this.normalizeOptionalText(dto.contact),
    });
    return this.normalizeUpdatedAt(await this.findOne(id));
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

  private async findUserOrFail(userRepository: Repository<User>, userId: string) {
    const user = await userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    return user;
  }

  private normalizeRequiredText(value: string) {
    const normalized = value.trim();

    if (!normalized) {
      throw new BadRequestException('Organization name is required');
    }

    return normalized;
  }

  private normalizeOptionalText(value?: string | null) {
    if (value === undefined || value === null) {
      return undefined;
    }

    const normalized = value.trim();

    return normalized.length > 0 ? normalized : null;
  }

  private normalizeUpdatedAt<T extends { updated_at?: Date | null; updated_by_id?: string | null; updated_by_user?: unknown } | null>(
    value: T,
  ): T {
    if (!value) {
      return value;
    }

    if (!value.updated_by_id && !value.updated_by_user) {
      value.updated_at = null;
    }

    return value;
  }

  private normalizeUpdatedAtList<T extends { updated_at?: Date | null; updated_by_id?: string | null; updated_by_user?: unknown }>(
    values: T[],
  ): T[] {
    return values.map((value) => this.normalizeUpdatedAt(value));
  }
}
