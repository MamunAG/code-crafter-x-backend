import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { PaginatedResponseDto } from 'src/common/dto/paginated-response.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { Country } from './entity/country.entity';
import { CreateCountryDto } from './dto/create-country.dto';
import { FilterCountryDto } from './dto/filter-country.dto';
import { UpdateCountryDto } from './dto/update-country.dto';

@Injectable()
export class CountryService {
  constructor(
    @InjectRepository(Country)
    private countryRepository: Repository<Country>,
  ) { }

  async create(countryDto: CreateCountryDto) {
    await this.ensureNameIsUnique(countryDto.name);
    const country = this.countryRepository.create(countryDto);
    const saved = await this.countryRepository.save(country);
    await this.countryRepository
      .createQueryBuilder()
      .update(Country)
      .set({
        updated_by_id: null,
        updated_at: () => 'NULL',
      } as unknown as Partial<Country>)
      .where('id = :id', { id: saved.id })
      .execute();
    return this.normalizeUpdatedAt(await this.findOne(saved.id));
  }

  async findAll(
    paginationDto: PaginationDto,
    filters?: Partial<FilterCountryDto>,
  ): Promise<PaginatedResponseDto<Country>> {
    const { page = 1, limit = 1000000000000 } = paginationDto;
    const deletedOnly = filters?.deletedOnly ?? false;
    const skip = (page - 1) * limit;

    const queryBuilder = this.countryRepository
      .createQueryBuilder('country')
      .leftJoinAndSelect('country.created_by_user', 'created_by_user')
      .leftJoinAndSelect('country.updated_by_user', 'updated_by_user')
      .leftJoinAndSelect('country.deleted_by_user', 'deleted_by_user')
      .skip(skip)
      .take(limit)
      .orderBy(deletedOnly ? 'country.deleted_at' : 'country.created_at', 'DESC');

    if (deletedOnly) {
      queryBuilder.withDeleted();
    }

    if (filters?.name) {
      queryBuilder.andWhere('country.name ILIKE :name', {
        name: `%${filters.name}%`,
      });
    }

    if (deletedOnly) {
      queryBuilder.andWhere('country.deleted_at IS NOT NULL');
    } else {
      queryBuilder.andWhere('country.deleted_at IS NULL');
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
    return this.countryRepository
      .createQueryBuilder('country')
      .leftJoinAndSelect('country.created_by_user', 'created_by_user')
      .leftJoinAndSelect('country.updated_by_user', 'updated_by_user')
      .leftJoinAndSelect('country.deleted_by_user', 'deleted_by_user')
      .where('country.id = :id', { id })
      .andWhere('country.deleted_at IS NULL')
      .getOne();
  }

  async update(id: number, dto: UpdateCountryDto) {
    await this.ensureNameIsUnique(dto.name, id);
    await this.countryRepository.update(id, dto);
    return this.normalizeUpdatedAt(await this.findOne(id));
  }

  async remove(id: number, deletedById: string) {
    await this.countryRepository.update(id, { deleted_by_id: deletedById });
    return this.countryRepository.softDelete(id);
  }

  permanentRemove(id: number) {
    return this.countryRepository.delete(id);
  }

  restore(id: number) {
    return this.countryRepository.restore(id);
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

    const queryBuilder = this.countryRepository
      .createQueryBuilder('country')
      .where('LOWER(TRIM(country.name)) = :name', { name: normalizedName })
      .andWhere('country.deleted_at IS NULL');

    if (ignoreId !== undefined) {
      queryBuilder.andWhere('country.id != :ignoreId', { ignoreId });
    }

    const existing = await queryBuilder.getOne();

    if (existing) {
      throw new BadRequestException('Country already exists');
    }
  }
}
