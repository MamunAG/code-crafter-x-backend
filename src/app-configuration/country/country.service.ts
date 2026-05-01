import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
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

  async create(countryDto: CreateCountryDto, organizationId: string) {
    await this.ensureNameIsUnique(countryDto.name, organizationId);
    const country = this.countryRepository.create({
      ...countryDto,
      organizationId,
    });
    const saved = await this.countryRepository.save(country);
    await this.countryRepository
      .createQueryBuilder()
      .update(Country)
      .set({
        updated_by_id: null,
        updated_at: () => 'NULL',
      } as unknown as Partial<Country>)
      .where('id = :id', { id: saved.id })
      .andWhere('organization_id = :organizationId', { organizationId })
      .execute();
    return this.normalizeUpdatedAt(await this.findOne(saved.id, organizationId));
  }

  buildUploadTemplate() {
    return 'name,isActive';
  }

  async importFromTemplate(file: Express.Multer.File | undefined, userId: string, organizationId: string) {
    if (!file?.buffer?.length) {
      throw new BadRequestException('Please upload a country template file.');
    }

    const rows = this.parseCountryTemplate(file.buffer.toString('utf8'));
    const uniqueNames = [...new Set(rows.map((row) => row.name.trim()).filter(Boolean))];

    if (!uniqueNames.length) {
      return {
        inserted: 0,
        skipped: 0,
      };
    }

    const existingCountries = await this.countryRepository
      .createQueryBuilder('country')
      .withDeleted()
      .select(['country.name'])
      .where('country.organization_id = :organizationId', { organizationId })
      .andWhere('LOWER(TRIM(country.name)) IN (:...names)', {
        names: uniqueNames.map((name) => name.toLowerCase()),
      })
      .getMany();
    const existingNameSet = new Set(existingCountries.map((country) => country.name.trim().toLowerCase()));
    const newCountries = rows
      .filter((row) => !existingNameSet.has(row.name.trim().toLowerCase()))
      .map((row) =>
        this.countryRepository.create({
          name: row.name.trim(),
          isActive: row.isActive,
          organizationId,
          created_by_id: userId,
          updated_by_id: null as unknown as string,
          updated_at: null as unknown as Date,
        }),
      );

    if (!newCountries.length) {
      return {
        inserted: 0,
        skipped: rows.length,
      };
    }

    const savedCountries = await this.countryRepository.save(newCountries);
    await this.countryRepository
      .createQueryBuilder()
      .update(Country)
      .set({
        updated_by_id: null,
        updated_at: () => 'NULL',
      } as unknown as Partial<Country>)
      .where('id IN (:...ids)', { ids: savedCountries.map((country) => country.id) })
      .execute();

    return {
      inserted: savedCountries.length,
      skipped: rows.length - savedCountries.length,
    };
  }

  async findAll(
    paginationDto: PaginationDto,
    filters: Partial<FilterCountryDto> | undefined,
    organizationId: string,
  ): Promise<PaginatedResponseDto<Country>> {
    const { page = 1, limit = 1000000000000 } = paginationDto;
    const deletedOnly = filters?.deletedOnly ?? false;
    const skip = (page - 1) * limit;

    const queryBuilder = this.countryRepository
      .createQueryBuilder('country')
      .leftJoinAndSelect('country.created_by_user', 'created_by_user')
      .leftJoinAndSelect('country.updated_by_user', 'updated_by_user')
      .leftJoinAndSelect('country.deleted_by_user', 'deleted_by_user')
      .where('country.organization_id = :organizationId', { organizationId })
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

  findOne(id: number, organizationId: string) {
    return this.countryRepository
      .createQueryBuilder('country')
      .leftJoinAndSelect('country.created_by_user', 'created_by_user')
      .leftJoinAndSelect('country.updated_by_user', 'updated_by_user')
      .leftJoinAndSelect('country.deleted_by_user', 'deleted_by_user')
      .where('country.organization_id = :organizationId', { organizationId })
      .andWhere('country.id = :id', { id })
      .andWhere('country.deleted_at IS NULL')
      .getOne()
      .then((country) => {
        if (!country) {
          throw new NotFoundException('Country not found in the selected organization.');
        }

        return this.normalizeUpdatedAt(country);
      });
  }

  async update(id: number, dto: UpdateCountryDto, organizationId: string) {
    await this.ensureCountryExists(id, organizationId);
    await this.ensureNameIsUnique(dto.name, organizationId, id);
    await this.countryRepository.update({ id, organizationId }, dto);
    return this.normalizeUpdatedAt(await this.findOne(id, organizationId));
  }

  async remove(id: number, deletedById: string, organizationId: string) {
    await this.ensureCountryExists(id, organizationId);
    await this.countryRepository.update({ id, organizationId }, { deleted_by_id: deletedById });
    return this.countryRepository.softDelete({ id, organizationId });
  }

  async permanentRemove(id: number, organizationId: string) {
    await this.ensureCountryExists(id, organizationId, true);
    return this.countryRepository.delete({ id, organizationId });
  }

  async restore(id: number, organizationId: string) {
    await this.ensureCountryExists(id, organizationId, true);
    return this.countryRepository.restore({ id, organizationId });
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

    const queryBuilder = this.countryRepository
      .createQueryBuilder('country')
      .where('LOWER(TRIM(country.name)) = :name', { name: normalizedName })
      .andWhere('country.organization_id = :organizationId', { organizationId })
      .andWhere('country.deleted_at IS NULL');

    if (ignoreId !== undefined) {
      queryBuilder.andWhere('country.id != :ignoreId', { ignoreId });
    }

    const existing = await queryBuilder.getOne();

    if (existing) {
      throw new BadRequestException('Country already exists');
    }
  }

  private async ensureCountryExists(id: number, organizationId: string, includeDeleted = false) {
    const queryBuilder = this.countryRepository
      .createQueryBuilder('country')
      .where('country.id = :id', { id })
      .andWhere('country.organization_id = :organizationId', { organizationId });

    if (includeDeleted) {
      queryBuilder.withDeleted();
    } else {
      queryBuilder.andWhere('country.deleted_at IS NULL');
    }

    const country = await queryBuilder.getOne();

    if (!country) {
      throw new NotFoundException('Country not found in the selected organization.');
    }

    return country;
  }

  private parseCountryTemplate(content: string) {
    const lines = content
      .replace(/^\uFEFF/, '')
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    if (lines.length === 0) {
      throw new BadRequestException('The uploaded template does not contain any country rows.');
    }

    if (lines.length === 1) {
      return [];
    }

    const headers = this.parseCsvLine(lines[0]).map((header) => header.trim().toLowerCase());
    const nameIndex = headers.indexOf('name');
    const activeIndex = headers.indexOf('isactive');

    if (nameIndex === -1) {
      throw new BadRequestException('The uploaded template must include a name column.');
    }

    return lines.slice(1).flatMap((line) => {
      const columns = this.parseCsvLine(line);
      const name = columns[nameIndex]?.trim() ?? '';

      if (!name) {
        return [];
      }

      return [
        {
          name,
          isActive: activeIndex === -1 ? true : this.parseBoolean(columns[activeIndex]),
        },
      ];
    });
  }

  private parseCsvLine(line: string) {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let index = 0; index < line.length; index += 1) {
      const character = line[index];
      const nextCharacter = line[index + 1];

      if (character === '"' && nextCharacter === '"') {
        current += '"';
        index += 1;
        continue;
      }

      if (character === '"') {
        inQuotes = !inQuotes;
        continue;
      }

      if (character === ',' && !inQuotes) {
        values.push(current);
        current = '';
        continue;
      }

      current += character;
    }

    values.push(current);
    return values;
  }

  private parseBoolean(value?: string) {
    const normalizedValue = value?.trim().toLowerCase();

    if (!normalizedValue) {
      return true;
    }

    return ['true', 'yes', 'y', '1', 'active'].includes(normalizedValue);
  }
}
