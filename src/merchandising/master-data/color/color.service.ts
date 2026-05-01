import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { PaginatedResponseDto } from 'src/common/dto/paginated-response.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { Color } from './entity/color.entity';
import { CreateColorDto } from './dto/create-color.dto';
import { FilterColorDto } from './dto/filter-color.dto';
import { UpdateColorDto } from './dto/update-color.dto';

@Injectable()
export class ColorService {
  constructor(
    @InjectRepository(Color)
    private colorRepository: Repository<Color>,
  ) { }

  async create(colorDto: CreateColorDto, organizationId: string) {
    await this.ensureColorNameIsUnique(colorDto.colorName, organizationId);
    const color = this.colorRepository.create({
      ...colorDto,
      organizationId,
      colorHexCode: this.normalizeHexColorCode(colorDto.colorHexCode),
    });
    const saved = await this.colorRepository.save(color);
    return this.normalizeUpdatedAt(await this.findOne(saved.id, organizationId));
  }

  async findAll(
    paginationDto: PaginationDto,
    filters?: Partial<FilterColorDto>,
    organizationId?: string,
  ): Promise<PaginatedResponseDto<Color>> {
    const { page = 1, limit = 1000000000000 } = paginationDto;
    const deletedOnly = filters?.deletedOnly ?? false;
    const skip = (page - 1) * limit;

    const queryBuilder = this.colorRepository
      .createQueryBuilder('color')
      .leftJoinAndSelect('color.created_by_user', 'created_by_user')
      .leftJoinAndSelect('color.updated_by_user', 'updated_by_user')
      .leftJoinAndSelect('color.deleted_by_user', 'deleted_by_user')
      .where('color.organization_id = :organizationId', { organizationId })
      .skip(skip)
      .take(limit)
      .orderBy(deletedOnly ? 'color.deleted_at' : 'color.created_at', 'DESC');

    if (deletedOnly) {
      queryBuilder.withDeleted();
    }

    if (filters?.colorName) {
      queryBuilder.andWhere('color.colorName ILIKE :colorName', {
        colorName: `%${filters.colorName}%`,
      });
    }
    if (filters?.colorDisplayName) {
      queryBuilder.andWhere('color.colorDisplayName ILIKE :colorDisplayName', {
        colorDisplayName: `%${filters.colorDisplayName}%`,
      });
    }
    if (filters?.colorDescription) {
      queryBuilder.andWhere('color.colorDescription ILIKE :colorDescription', {
        colorDescription: `%${filters.colorDescription}%`,
      });
    }

    if (deletedOnly) {
      queryBuilder.andWhere('color.deleted_at IS NOT NULL');
    } else {
      queryBuilder.andWhere('color.deleted_at IS NULL');
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
    return this.colorRepository
      .createQueryBuilder('color')
      .leftJoinAndSelect('color.created_by_user', 'created_by_user')
      .leftJoinAndSelect('color.updated_by_user', 'updated_by_user')
      .leftJoinAndSelect('color.deleted_by_user', 'deleted_by_user')
      .where('color.organization_id = :organizationId', { organizationId })
      .andWhere('color.id = :id', { id })
      .andWhere('color.deleted_at IS NULL')
      .getOne()
      .then((color) => {
        if (!color) {
          throw new NotFoundException('Color not found in the selected organization.');
        }

        return this.normalizeUpdatedAt(color);
      });
  }

  async update(id: number, dto: UpdateColorDto, organizationId: string) {
    await this.ensureColorExists(id, organizationId);
    await this.ensureColorNameIsUnique(dto.colorName, organizationId, id);
    await this.colorRepository.update(id, {
      ...dto,
      colorHexCode: this.normalizeHexColorCode(dto.colorHexCode),
    });
    return this.normalizeUpdatedAt(await this.findOne(id, organizationId));
  }

  private async ensureColorNameIsUnique(colorName: string, organizationId: string, ignoreId?: number) {
    const normalizedColorName = colorName.trim().toLowerCase();

    const queryBuilder = this.colorRepository
      .createQueryBuilder('color')
      .where('LOWER(TRIM(color.colorName)) = :colorName', {
        colorName: normalizedColorName,
      })
      .andWhere('color.organization_id = :organizationId', { organizationId })
      .andWhere('color.deleted_at IS NULL');

    if (ignoreId !== undefined) {
      queryBuilder.andWhere('color.id != :ignoreId', { ignoreId });
    }

    const existingColor = await queryBuilder.getOne();

    if (existingColor) {
      throw new BadRequestException('Color already exists');
    }
  }

  async remove(id: number, deletedById: string, organizationId: string) {
    await this.ensureColorExists(id, organizationId);
    await this.colorRepository.update({ id, organizationId }, { deleted_by_id: deletedById });
    return this.colorRepository.softDelete({ id, organizationId });
  }

  private normalizeHexColorCode(value?: string | null) {
    const trimmed = value?.trim();

    if (!trimmed) {
      return null;
    }

    return trimmed.startsWith('#') ? trimmed.toUpperCase() : `#${trimmed.toUpperCase()}`;
  }

  async permanentRemove(id: number, organizationId: string) {
    await this.ensureColorExists(id, organizationId, true);
    return this.colorRepository.delete({ id, organizationId });
  }

  async restore(id: number, organizationId: string) {
    await this.ensureColorExists(id, organizationId, true);
    return this.colorRepository.restore({ id, organizationId });
  }

  private async ensureColorExists(id: number, organizationId: string, includeDeleted = false) {
    const queryBuilder = this.colorRepository
      .createQueryBuilder('color')
      .where('color.id = :id', { id })
      .andWhere('color.organization_id = :organizationId', { organizationId });

    if (includeDeleted) {
      queryBuilder.withDeleted();
    } else {
      queryBuilder.andWhere('color.deleted_at IS NULL');
    }

    const color = await queryBuilder.getOne();

    if (!color) {
      throw new NotFoundException('Color not found in the selected organization.');
    }

    return color;
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
