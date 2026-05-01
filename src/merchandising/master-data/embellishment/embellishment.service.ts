import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { PaginatedResponseDto } from 'src/common/dto/paginated-response.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { Embellishment } from './entity/embellishment.entity';
import { CreateEmbellishmentDto } from './dto/create-embellishment.dto';
import { FilterEmbellishmentDto } from './dto/filter-embellishment.dto';
import { UpdateEmbellishmentDto } from './dto/update-embellishment.dto';

@Injectable()
export class EmbellishmentService {
  constructor(
    @InjectRepository(Embellishment)
    private embellishmentRepository: Repository<Embellishment>,
  ) { }

  async create(embellishmentDto: CreateEmbellishmentDto, organizationId: string) {
    await this.ensureNameIsUnique(embellishmentDto.name, organizationId);
    const embellishment = this.embellishmentRepository.create({
      ...embellishmentDto,
      organizationId,
    });
    const saved = await this.embellishmentRepository.save(embellishment);
    await this.embellishmentRepository
      .createQueryBuilder()
      .update(Embellishment)
      .set({
        updated_by_id: null,
        updated_at: () => 'NULL',
      } as unknown as Partial<Embellishment>)
      .where('id = :id', { id: saved.id })
      .andWhere('organization_id = :organizationId', { organizationId })
      .execute();
    return this.normalizeUpdatedAt(await this.findOne(saved.id, organizationId));
  }

  async findAll(
    paginationDto: PaginationDto,
    filters?: Partial<FilterEmbellishmentDto>,
    organizationId?: string,
  ): Promise<PaginatedResponseDto<Embellishment>> {
    const { page = 1, limit = 1000000000000 } = paginationDto;
    const deletedOnly = filters?.deletedOnly ?? false;
    const skip = (page - 1) * limit;

    const queryBuilder = this.embellishmentRepository
      .createQueryBuilder('embellishment')
      .leftJoinAndSelect('embellishment.created_by_user', 'created_by_user')
      .leftJoinAndSelect('embellishment.updated_by_user', 'updated_by_user')
      .leftJoinAndSelect('embellishment.deleted_by_user', 'deleted_by_user')
      .where('embellishment.organization_id = :organizationId', { organizationId })
      .skip(skip)
      .take(limit)
      .orderBy(deletedOnly ? 'embellishment.deleted_at' : 'embellishment.created_at', 'DESC');

    if (deletedOnly) {
      queryBuilder.withDeleted();
    }

    if (filters?.name) {
      queryBuilder.andWhere('LOWER(TRIM(embellishment.name)) LIKE :name', {
        name: `%${filters.name.trim().toLowerCase()}%`,
      });
    }
    if (filters?.remarks) {
      queryBuilder.andWhere('embellishment.remarks ILIKE :remarks', {
        remarks: `%${filters.remarks}%`,
      });
    }
    if (filters?.isActive) {
      queryBuilder.andWhere('embellishment.isActive = :isActive', {
        isActive: filters.isActive,
      });
    }

    if (deletedOnly) {
      queryBuilder.andWhere('embellishment.deleted_at IS NOT NULL');
    } else {
      queryBuilder.andWhere('embellishment.deleted_at IS NULL');
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

  findOne(id: number, organizationId: string) {
    return this.embellishmentRepository
      .createQueryBuilder('embellishment')
      .leftJoinAndSelect('embellishment.created_by_user', 'created_by_user')
      .leftJoinAndSelect('embellishment.updated_by_user', 'updated_by_user')
      .leftJoinAndSelect('embellishment.deleted_by_user', 'deleted_by_user')
      .where('embellishment.organization_id = :organizationId', { organizationId })
      .andWhere('embellishment.id = :id', { id })
      .andWhere('embellishment.deleted_at IS NULL')
      .getOne()
      .then((embellishment) => {
        if (!embellishment) {
          throw new NotFoundException('Embellishment not found in the selected organization.');
        }

        return this.normalizeUpdatedAt(embellishment);
      });
  }

  async update(id: number, dto: UpdateEmbellishmentDto, organizationId: string) {
    await this.ensureEmbellishmentExists(id, organizationId);
    await this.ensureNameIsUnique(dto.name, organizationId, id);
    await this.embellishmentRepository.update({ id, organizationId }, dto);
    return this.normalizeUpdatedAt(await this.findOne(id, organizationId));
  }

  async remove(id: number, deletedById: string, organizationId: string) {
    await this.ensureEmbellishmentExists(id, organizationId);
    await this.embellishmentRepository.update({ id, organizationId }, { deleted_by_id: deletedById });
    return this.embellishmentRepository.softDelete({ id, organizationId });
  }

  async permanentRemove(id: number, organizationId: string) {
    await this.ensureEmbellishmentExists(id, organizationId, true);
    return this.embellishmentRepository.delete({ id, organizationId });
  }

  async restore(id: number, organizationId: string) {
    await this.ensureEmbellishmentExists(id, organizationId, true);
    return this.embellishmentRepository.restore({ id, organizationId });
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

  private async ensureNameIsUnique(name: string, organizationId: string, ignoreId?: number) {
    const normalizedName = name.trim().toLowerCase();

    const queryBuilder = this.embellishmentRepository
      .createQueryBuilder('embellishment')
      .where('LOWER(TRIM(embellishment.name)) = :name', { name: normalizedName })
      .andWhere('embellishment.organization_id = :organizationId', { organizationId })
      .andWhere('embellishment.deleted_at IS NULL');

    if (ignoreId !== undefined) {
      queryBuilder.andWhere('embellishment.id != :ignoreId', { ignoreId });
    }

    const existing = await queryBuilder.getOne();

    if (existing) {
      throw new BadRequestException('Embellishment already exists');
    }
  }

  private async ensureEmbellishmentExists(id: number, organizationId: string, includeDeleted = false) {
    const queryBuilder = this.embellishmentRepository
      .createQueryBuilder('embellishment')
      .where('embellishment.id = :id', { id })
      .andWhere('embellishment.organization_id = :organizationId', { organizationId });

    if (includeDeleted) {
      queryBuilder.withDeleted();
    } else {
      queryBuilder.andWhere('embellishment.deleted_at IS NULL');
    }

    const embellishment = await queryBuilder.getOne();

    if (!embellishment) {
      throw new NotFoundException('Embellishment not found in the selected organization.');
    }

    return embellishment;
  }
}
