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
    return this.findOne(saved.id);
  }

  async findAll(
    paginationDto: PaginationDto,
    filters?: Partial<FilterCountryDto>,
  ): Promise<PaginatedResponseDto<Country>> {
    const { page = 1, limit = 1000000000000 } = paginationDto;
    const skip = (page - 1) * limit;

    const queryBuilder = this.countryRepository
      .createQueryBuilder('country')
      .leftJoinAndSelect('country.created_by_user', 'created_by_user')
      .leftJoinAndSelect('country.updated_by_user', 'updated_by_user')
      .skip(skip)
      .take(limit)
      .orderBy('country.created_at', 'DESC');

    if (filters?.name) {
      queryBuilder.andWhere('country.name ILIKE :name', {
        name: `%${filters.name}%`,
      });
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

  findOne(id: number) {
    return this.countryRepository
      .createQueryBuilder('country')
      .leftJoinAndSelect('country.created_by_user', 'created_by_user')
      .leftJoinAndSelect('country.updated_by_user', 'updated_by_user')
      .where('country.id = :id', { id })
      .andWhere('country.deleted_at IS NULL')
      .getOne();
  }

  async update(id: number, dto: UpdateCountryDto) {
    await this.ensureNameIsUnique(dto.name, id);
    await this.countryRepository.update(id, dto);
    return this.findOne(id);
  }

  remove(id: number) {
    return this.countryRepository.softDelete(id);
  }

  permanentRemove(id: number) {
    return this.countryRepository.delete(id);
  }

  restore(id: number) {
    return this.countryRepository.restore(id);
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
