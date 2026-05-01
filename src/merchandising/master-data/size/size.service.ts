import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { PaginatedResponseDto } from 'src/common/dto/paginated-response.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { Size } from './entity/size.entity';
import { CreateSizeDto } from './dto/create-size.dto';
import { FilterSizeDto } from './dto/filter-size.dto';
import { UpdateSizeDto } from './dto/update-size.dto';

@Injectable()
export class SizeService {
  constructor(
    @InjectRepository(Size)
    private sizeRepository: Repository<Size>,
  ) { }

  async create(sizeDto: CreateSizeDto, organizationId: string) {
    await this.ensureSizeNameIsUnique(sizeDto.sizeName, organizationId);
    const size = this.sizeRepository.create({
      ...sizeDto,
      organizationId,
    });
    const saved = await this.sizeRepository.save(size);
    return this.normalizeUpdatedAt(await this.findOne(saved.id, organizationId));
  }

  async findAll(
    paginationDto: PaginationDto,
    filters?: Partial<FilterSizeDto>,
    organizationId?: string,
  ): Promise<PaginatedResponseDto<Size>> {
    const { page = 1, limit = 1000000000000 } = paginationDto;
    const deletedOnly = filters?.deletedOnly ?? false;
    const skip = (page - 1) * limit;

    const queryBuilder = this.sizeRepository
      .createQueryBuilder('size')
      .leftJoinAndSelect('size.created_by_user', 'created_by_user')
      .leftJoinAndSelect('size.updated_by_user', 'updated_by_user')
      .leftJoinAndSelect('size.deleted_by_user', 'deleted_by_user')
      .where('size.organization_id = :organizationId', { organizationId })
      .skip(skip)
      .take(limit)
      .orderBy(deletedOnly ? 'size.deleted_at' : 'size.created_at', 'DESC');

    if (deletedOnly) {
      queryBuilder.withDeleted();
    }

    if (filters?.sizeName) {
      queryBuilder.andWhere('LOWER(TRIM(size.sizeName)) LIKE :sizeName', {
        sizeName: `%${filters.sizeName.trim().toLowerCase()}%`,
      });
    }

    if (deletedOnly) {
      queryBuilder.andWhere('size.deleted_at IS NOT NULL');
    } else {
      queryBuilder.andWhere('size.deleted_at IS NULL');
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
    return this.sizeRepository
      .createQueryBuilder('size')
      .leftJoinAndSelect('size.created_by_user', 'created_by_user')
      .leftJoinAndSelect('size.updated_by_user', 'updated_by_user')
      .leftJoinAndSelect('size.deleted_by_user', 'deleted_by_user')
      .where('size.organization_id = :organizationId', { organizationId })
      .andWhere('size.id = :id', { id })
      .andWhere('size.deleted_at IS NULL')
      .getOne()
      .then((size) => {
        if (!size) {
          throw new NotFoundException('Size not found in the selected organization.');
        }

        return this.normalizeUpdatedAt(size);
      });
  }

  async update(id: number, dto: UpdateSizeDto, organizationId: string) {
    await this.ensureSizeExists(id, organizationId);
    await this.ensureSizeNameIsUnique(dto.sizeName, organizationId, id);
    await this.sizeRepository.update({ id, organizationId }, dto);
    return this.normalizeUpdatedAt(await this.findOne(id, organizationId));
  }

  async remove(id: number, deletedById: string, organizationId: string) {
    await this.ensureSizeExists(id, organizationId);
    await this.sizeRepository.update({ id, organizationId }, { deleted_by_id: deletedById });
    return this.sizeRepository.softDelete({ id, organizationId });
  }

  async permanentRemove(id: number, organizationId: string) {
    await this.ensureSizeExists(id, organizationId, true);
    return this.sizeRepository.delete({ id, organizationId });
  }

  async restore(id: number, organizationId: string) {
    await this.ensureSizeExists(id, organizationId, true);
    return this.sizeRepository.restore({ id, organizationId });
  }

  private async ensureSizeNameIsUnique(sizeName: string, organizationId: string, ignoreId?: number) {
    const normalizedSizeName = sizeName.trim().toLowerCase();

    const queryBuilder = this.sizeRepository
      .createQueryBuilder('size')
      .where('LOWER(TRIM(size.sizeName)) = :sizeName', {
        sizeName: normalizedSizeName,
      })
      .andWhere('size.organization_id = :organizationId', { organizationId })
      .andWhere('size.deleted_at IS NULL');

    if (ignoreId !== undefined) {
      queryBuilder.andWhere('size.id != :ignoreId', { ignoreId });
    }

    const existingSize = await queryBuilder.getOne();

    if (existingSize) {
      throw new BadRequestException('Size already exists');
    }
  }

  private async ensureSizeExists(id: number, organizationId: string, includeDeleted = false) {
    const queryBuilder = this.sizeRepository
      .createQueryBuilder('size')
      .where('size.id = :id', { id })
      .andWhere('size.organization_id = :organizationId', { organizationId });

    if (includeDeleted) {
      queryBuilder.withDeleted();
    } else {
      queryBuilder.andWhere('size.deleted_at IS NULL');
    }

    const size = await queryBuilder.getOne();

    if (!size) {
      throw new NotFoundException('Size not found in the selected organization.');
    }

    return size;
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
