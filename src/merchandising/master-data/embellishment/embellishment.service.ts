import { BadRequestException, Injectable } from '@nestjs/common';
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

  async create(embellishmentDto: CreateEmbellishmentDto) {
    await this.ensureNameIsUnique(embellishmentDto.name);
    const embellishment = this.embellishmentRepository.create(embellishmentDto);
    const saved = await this.embellishmentRepository.save(embellishment);
    await this.embellishmentRepository
      .createQueryBuilder()
      .update(Embellishment)
      .set({
        updated_by_id: null,
        updated_at: () => 'NULL',
      } as unknown as Partial<Embellishment>)
      .where('id = :id', { id: saved.id })
      .execute();
    return this.normalizeUpdatedAt(await this.findOne(saved.id));
  }

  async findAll(
    paginationDto: PaginationDto,
    filters?: Partial<FilterEmbellishmentDto>,
  ): Promise<PaginatedResponseDto<Embellishment>> {
    const { page = 1, limit = 1000000000000 } = paginationDto;
    const deletedOnly = filters?.deletedOnly ?? false;
    const skip = (page - 1) * limit;

    const queryBuilder = this.embellishmentRepository
      .createQueryBuilder('embellishment')
      .leftJoinAndSelect('embellishment.created_by_user', 'created_by_user')
      .leftJoinAndSelect('embellishment.updated_by_user', 'updated_by_user')
      .leftJoinAndSelect('embellishment.deleted_by_user', 'deleted_by_user')
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

  findOne(id: number) {
    return this.embellishmentRepository
      .createQueryBuilder('embellishment')
      .leftJoinAndSelect('embellishment.created_by_user', 'created_by_user')
      .leftJoinAndSelect('embellishment.updated_by_user', 'updated_by_user')
      .leftJoinAndSelect('embellishment.deleted_by_user', 'deleted_by_user')
      .where('embellishment.id = :id', { id })
      .andWhere('embellishment.deleted_at IS NULL')
      .getOne();
  }

  async update(id: number, dto: UpdateEmbellishmentDto) {
    await this.ensureNameIsUnique(dto.name, id);
    await this.embellishmentRepository.update(id, dto);
    return this.normalizeUpdatedAt(await this.findOne(id));
  }

  async remove(id: number, deletedById: string) {
    await this.embellishmentRepository.update(id, { deleted_by_id: deletedById });
    return this.embellishmentRepository.softDelete(id);
  }

  permanentRemove(id: number) {
    return this.embellishmentRepository.delete(id);
  }

  restore(id: number) {
    return this.embellishmentRepository.restore(id);
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

  private async ensureNameIsUnique(name: string, ignoreId?: number) {
    const normalizedName = name.trim().toLowerCase();

    const queryBuilder = this.embellishmentRepository
      .createQueryBuilder('embellishment')
      .where('LOWER(TRIM(embellishment.name)) = :name', { name: normalizedName })
      .andWhere('embellishment.deleted_at IS NULL');

    if (ignoreId !== undefined) {
      queryBuilder.andWhere('embellishment.id != :ignoreId', { ignoreId });
    }

    const existing = await queryBuilder.getOne();

    if (existing) {
      throw new BadRequestException('Embellishment already exists');
    }
  }
}
