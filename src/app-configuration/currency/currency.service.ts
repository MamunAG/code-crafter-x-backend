import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { PaginatedResponseDto } from 'src/common/dto/paginated-response.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { Currency } from './entity/currency.entity';
import { CreateCurrencyDto } from './dto/create-currency.dto';
import { FilterCurrencyDto } from './dto/filter-currency.dto';
import { UpdateCurrencyDto } from './dto/update-currency.dto';

@Injectable()
export class CurrencyService {
  constructor(
    @InjectRepository(Currency)
    private currencyRepository: Repository<Currency>,
  ) { }

  async create(currencyDto: CreateCurrencyDto) {
    await this.ensureCurrencyCodeIsUnique(currencyDto.currencyCode);
    const currency = this.currencyRepository.create(currencyDto);
    const saved = await this.currencyRepository.save(currency);
    await this.currencyRepository
      .createQueryBuilder()
      .update(Currency)
      .set({
        updated_by_id: null,
        updated_at: () => 'NULL',
      } as unknown as Partial<Currency>)
      .where('id = :id', { id: saved.id })
      .execute();
    return this.normalizeUpdatedAt(await this.findOne(saved.id));
  }

  async findAll(
    paginationDto: PaginationDto,
    filters?: Partial<FilterCurrencyDto>,
  ): Promise<PaginatedResponseDto<Currency>> {
    const { page = 1, limit = 1000000000000 } = paginationDto;
    const deletedOnly = filters?.deletedOnly ?? false;
    const skip = (page - 1) * limit;

    const queryBuilder = this.currencyRepository
      .createQueryBuilder('currency')
      .leftJoinAndSelect('currency.created_by_user', 'created_by_user')
      .leftJoinAndSelect('currency.updated_by_user', 'updated_by_user')
      .leftJoinAndSelect('currency.deleted_by_user', 'deleted_by_user')
      .skip(skip)
      .take(limit)
      .orderBy(deletedOnly ? 'currency.deleted_at' : 'currency.created_at', 'DESC');

    if (deletedOnly) {
      queryBuilder.withDeleted();
    }

    if (filters?.currencyName) {
      queryBuilder.andWhere('currency.currencyName ILIKE :currencyName', {
        currencyName: `%${filters.currencyName}%`,
      });
    }

    if (filters?.currencyCode) {
      queryBuilder.andWhere('currency.currencyCode ILIKE :currencyCode', {
        currencyCode: `%${filters.currencyCode}%`,
      });
    }

    if (filters?.symbol) {
      queryBuilder.andWhere('currency.symbol ILIKE :symbol', {
        symbol: `%${filters.symbol}%`,
      });
    }

    if (filters?.isDefault !== undefined) {
      queryBuilder.andWhere('currency.isDefault = :isDefault', {
        isDefault: filters.isDefault,
      });
    }

    if (filters?.isActive !== undefined) {
      queryBuilder.andWhere('currency.isActive = :isActive', {
        isActive: filters.isActive,
      });
    }

    if (deletedOnly) {
      queryBuilder.andWhere('currency.deleted_at IS NOT NULL');
    } else {
      queryBuilder.andWhere('currency.deleted_at IS NULL');
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
    return this.currencyRepository
      .createQueryBuilder('currency')
      .leftJoinAndSelect('currency.created_by_user', 'created_by_user')
      .leftJoinAndSelect('currency.updated_by_user', 'updated_by_user')
      .leftJoinAndSelect('currency.deleted_by_user', 'deleted_by_user')
      .where('currency.id = :id', { id })
      .andWhere('currency.deleted_at IS NULL')
      .getOne();
  }

  async update(id: number, dto: UpdateCurrencyDto) {
    await this.ensureCurrencyCodeIsUnique(dto.currencyCode, id);
    await this.currencyRepository.update(id, dto);
    return this.normalizeUpdatedAt(await this.findOne(id));
  }

  async remove(id: number, deletedById: string) {
    await this.currencyRepository.update(id, { deleted_by_id: deletedById });
    return this.currencyRepository.softDelete(id);
  }

  permanentRemove(id: number) {
    return this.currencyRepository.delete(id);
  }

  restore(id: number) {
    return this.currencyRepository.restore(id);
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

  private async ensureCurrencyCodeIsUnique(currencyCode: string, ignoreId?: number) {
    const normalizedCurrencyCode = currencyCode.trim().toLowerCase();

    const queryBuilder = this.currencyRepository
      .createQueryBuilder('currency')
      .where('LOWER(TRIM(currency.currencyCode)) = :currencyCode', {
        currencyCode: normalizedCurrencyCode,
      })
      .andWhere('currency.deleted_at IS NULL');

    if (ignoreId !== undefined) {
      queryBuilder.andWhere('currency.id != :ignoreId', { ignoreId });
    }

    const existingCurrency = await queryBuilder.getOne();

    if (existingCurrency) {
      throw new BadRequestException('Currency already exists');
    }
  }
}
