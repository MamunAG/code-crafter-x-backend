import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Country } from 'src/app-configuration/country/entity/country.entity';
import { PaginatedResponseDto } from 'src/common/dto/paginated-response.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { Buyer } from './entity/buyer.entity';
import { CreateBuyerDto } from './dto/create-buyer.dto';
import { FilterBuyerDto } from './dto/filter-buyer.dto';
import { UpdateBuyerDto } from './dto/update-buyer.dto';

type BuyerListFilters = Partial<FilterBuyerDto> & {
  deletedOnly?: string | boolean;
};

@Injectable()
export class BuyerService {
  constructor(
    @InjectRepository(Buyer)
    private buyerRepository: Repository<Buyer>,

    @InjectRepository(Country)
    private countryRepository: Repository<Country>,
  ) { }

  async create(buyerDto: CreateBuyerDto, organizationId: string) {
    const normalizedBuyer = this.normalizeBuyerPayload(buyerDto);
    await this.ensureBuyerIdentityPairUnique(normalizedBuyer.name, normalizedBuyer.displayName, organizationId);
    const country = normalizedBuyer.countryId ? await this.findCountryOrFail(normalizedBuyer.countryId, organizationId) : null;

    const buyer = this.buyerRepository.create({
      ...normalizedBuyer,
      organizationId,
      country,
    });

    const saved = await this.buyerRepository.save(buyer);
    await this.buyerRepository
      .createQueryBuilder()
      .update(Buyer)
      .set({
        updated_by_id: null,
        updated_at: () => 'NULL',
      } as unknown as Partial<Buyer>)
      .where('id = :id', { id: saved.id })
      .andWhere('organization_id = :organizationId', { organizationId })
      .execute();

    return this.normalizeUpdatedAt(await this.findOne(saved.id, organizationId));
  }

  buildUploadTemplate() {
    return [
      'name,displayName,contact,email,countryName,address,isActive,remarks',
      'example-buyer,Example Buyer,+8801700000000,buyer@example.com,Bangladesh,"Dhaka, Bangladesh",true,Sample buyer',
    ].join('\n');
  }

  async importFromTemplate(file: Express.Multer.File | undefined, userId: string, organizationId: string) {
    if (!file?.buffer?.length) {
      throw new BadRequestException('Please upload a buyer template file.');
    }

    const rows = this.parseBuyerTemplate(file.buffer.toString('utf8'));

    if (!rows.length) {
      return {
        inserted: 0,
        skipped: 0,
      };
    }

    const countries = await this.countryRepository
      .createQueryBuilder('country')
      .select(['country.id', 'country.name'])
      .where('country.organization_id = :organizationId', { organizationId })
      .andWhere('country.deleted_at IS NULL')
      .andWhere('country.is_active = :isActive', { isActive: true })
      .getMany();
    const countryIdByName = new Map(
      countries
        .map((country) => [country.name?.trim().toLowerCase(), country.id] as const)
        .filter((entry): entry is readonly [string, number] => Boolean(entry[0])),
    );
    const missingCountries = new Set<string>();
    const filteredRows = rows.flatMap((row) => {
      const countryId = this.resolveCountryName(row.countryName, countryIdByName);

      if (row.countryName && !countryId) {
        missingCountries.add(row.countryName);
        return [];
      }

      return [
        {
          ...this.normalizeBuyerPayload(row),
          countryId,
        },
      ];
    });

    this.throwMissingSetupError(missingCountries, rows.length);

    const uniqueBuyerNames = [
      ...new Set(
        filteredRows
          .map((row) => row.name?.trim().toLowerCase())
          .filter((name): name is string => Boolean(name)),
      ),
    ];
    const uniqueBuyerDisplayNames = [
      ...new Set(
        filteredRows
          .map((row) => row.displayName?.trim().toLowerCase())
          .filter((displayName): displayName is string => Boolean(displayName)),
      ),
    ];
    const existingBuyerIdentities = uniqueBuyerNames.length || uniqueBuyerDisplayNames.length
      ? await this.buyerRepository
        .createQueryBuilder('buyer')
        .withDeleted()
        .select(['buyer.name', 'buyer.displayName'])
        .where('buyer.organization_id = :organizationId', { organizationId })
        .andWhere(
          '(LOWER(TRIM(buyer.name)) IN (:...names) OR LOWER(TRIM(buyer.displayName)) IN (:...displayNames))',
          {
            names: uniqueBuyerNames.length ? uniqueBuyerNames : [''],
            displayNames: uniqueBuyerDisplayNames.length ? uniqueBuyerDisplayNames : [''],
          },
        )
        .getMany()
      : [];
    const existingBuyerPairSet = new Set(
      existingBuyerIdentities
        .map((buyer) => this.normalizeBuyerIdentityKey(buyer.name, buyer.displayName))
        .filter((identity): identity is string => Boolean(identity)),
    );
    const seenBuyerPairSet = new Set<string>();
    const buyersToCreate = filteredRows
      .filter((row) => {
        const identityKey = this.normalizeBuyerIdentityKey(row.name, row.displayName);

        if (!identityKey) {
          return false;
        }

        if (existingBuyerPairSet.has(identityKey)) {
          return false;
        }

        if (seenBuyerPairSet.has(identityKey)) {
          return false;
        }

        seenBuyerPairSet.add(identityKey);

        return true;
      })
      .map((row) =>
        this.buyerRepository.create({
          name: row.name,
          displayName: row.displayName,
          contact: row.contact,
          email: row.email,
          countryId: row.countryId,
          address: row.address,
          remarks: row.remarks,
          isActive: row.isActive,
          organizationId,
          created_by_id: userId,
          updated_by_id: null as unknown as string,
          updated_at: null as unknown as Date,
        }),
      );

    if (!buyersToCreate.length) {
      return {
        inserted: 0,
        skipped: rows.length,
      };
    }

    const savedBuyers = await this.buyerRepository.save(buyersToCreate);
    await this.buyerRepository
      .createQueryBuilder()
      .update(Buyer)
      .set({
        updated_by_id: null,
        updated_at: () => 'NULL',
      } as unknown as Partial<Buyer>)
      .where('id IN (:...ids)', { ids: savedBuyers.map((buyer) => buyer.id) })
      .execute();

    return {
      inserted: savedBuyers.length,
      skipped: rows.length - savedBuyers.length,
    };
  }

  async findAll(
    paginationDto: PaginationDto,
    filters?: BuyerListFilters,
    organizationId?: string,
  ): Promise<PaginatedResponseDto<Buyer>> {
    const { page = 1, limit = 1000000000000 } = paginationDto;
    const deletedOnly = filters?.deletedOnly === true || filters?.deletedOnly === 'true';
    const skip = (page - 1) * limit;

    const queryBuilder = this.buyerRepository
      .createQueryBuilder('buyer')
      .leftJoinAndSelect('buyer.country', 'country')
      .leftJoinAndSelect('buyer.created_by_user', 'created_by_user')
      .leftJoinAndSelect('buyer.updated_by_user', 'updated_by_user')
      .leftJoinAndSelect('buyer.deleted_by_user', 'deleted_by_user')
      .where('buyer.organization_id = :organizationId', { organizationId })
      .skip(skip)
      .take(limit)
      .orderBy(deletedOnly ? 'buyer.deleted_at' : 'buyer.created_at', 'DESC');

    if (deletedOnly) {
      queryBuilder.withDeleted();
    }

    if (filters?.name) {
      queryBuilder.andWhere('buyer.name ILIKE :name', {
        name: `%${filters.name}%`,
      });
    }

    if (filters?.displayName) {
      queryBuilder.andWhere('buyer.displayName ILIKE :displayName', {
        displayName: `%${filters.displayName}%`,
      });
    }

    if (filters?.contact) {
      queryBuilder.andWhere('buyer.contact ILIKE :contact', {
        contact: `%${filters.contact}%`,
      });
    }

    if (filters?.email) {
      queryBuilder.andWhere('buyer.email ILIKE :email', {
        email: `%${filters.email}%`,
      });
    }

    if (filters?.countryId !== undefined) {
      queryBuilder.andWhere('country.id = :countryId', {
        countryId: filters.countryId,
      });
    }

    if (filters?.address) {
      queryBuilder.andWhere('buyer.address ILIKE :address', {
        address: `%${filters.address}%`,
      });
    }

    if (filters?.remarks) {
      queryBuilder.andWhere('buyer.remarks ILIKE :remarks', {
        remarks: `%${filters.remarks}%`,
      });
    }

    if (filters?.isActive !== undefined && filters?.isActive !== '') {
      queryBuilder.andWhere('buyer.isActive = :isActive', {
        isActive: this.parseBoolean(filters.isActive),
      });
    }

    if (deletedOnly) {
      queryBuilder.andWhere('buyer.deleted_at IS NOT NULL');
    } else {
      queryBuilder.andWhere('buyer.deleted_at IS NULL');
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

  findOne(id: string, organizationId: string) {
    return this.buyerRepository
      .createQueryBuilder('buyer')
      .leftJoinAndSelect('buyer.country', 'country')
      .leftJoinAndSelect('buyer.created_by_user', 'created_by_user')
      .leftJoinAndSelect('buyer.updated_by_user', 'updated_by_user')
      .leftJoinAndSelect('buyer.deleted_by_user', 'deleted_by_user')
      .where('buyer.organization_id = :organizationId', { organizationId })
      .andWhere('buyer.id = :id', { id })
      .andWhere('buyer.deleted_at IS NULL')
      .getOne()
      .then((buyer) => {
        if (!buyer) {
          throw new NotFoundException('Buyer not found in the selected organization.');
        }

        return this.normalizeUpdatedAt(buyer);
      });
  }

  async update(id: string, dto: UpdateBuyerDto, organizationId: string) {
    const normalizedBuyer = this.normalizeBuyerPayload(dto);
    const existingBuyer = await this.ensureBuyerExists(id, organizationId);

    await this.ensureBuyerIdentityPairUnique(
      normalizedBuyer.name ?? existingBuyer.name,
      normalizedBuyer.displayName ?? existingBuyer.displayName,
      organizationId,
      id,
    );

    if (normalizedBuyer.countryId) {
      await this.findCountryOrFail(normalizedBuyer.countryId, organizationId);
    }

    await this.buyerRepository.update({ id, organizationId }, normalizedBuyer);
    return this.normalizeUpdatedAt(await this.findOne(id, organizationId));
  }

  async remove(id: string, deletedById: string, organizationId: string) {
    await this.ensureBuyerExists(id, organizationId);
    await this.buyerRepository.update({ id, organizationId }, { deleted_by_id: deletedById });
    return this.buyerRepository.softDelete({ id, organizationId });
  }

  async permanentRemove(id: string, organizationId: string) {
    await this.ensureBuyerExists(id, organizationId, true);
    return this.buyerRepository.delete({ id, organizationId });
  }

  async restore(id: string, organizationId: string) {
    await this.ensureBuyerExists(id, organizationId, true);
    return this.buyerRepository.restore({ id, organizationId });
  }

  private async findCountryOrFail(countryId: number, organizationId: string) {
    const country = await this.countryRepository.findOne({
      where: { id: countryId, organizationId },
    });

    if (!country) {
      throw new BadRequestException('Country not found in the selected organization.');
    }

    return country;
  }

  private normalizeBuyerPayload(dto: Partial<CreateBuyerDto>): Partial<Buyer> {
    const payload: Partial<Buyer> = {};

    if (dto.name !== undefined) {
      payload.name = dto.name.trim();
    }

    if (dto.displayName !== undefined) {
      payload.displayName = dto.displayName.trim();
    }

    if ('contact' in dto) {
      payload.contact = this.nullableString(dto.contact);
    }

    if ('email' in dto) {
      payload.email = this.nullableString(dto.email)?.toLowerCase() ?? null;
    }

    if ('countryId' in dto) {
      payload.countryId = this.nullableNumber(dto.countryId);
    }

    if ('address' in dto) {
      payload.address = this.nullableString(dto.address);
    }

    if ('remarks' in dto) {
      payload.remarks = this.nullableString(dto.remarks);
    }

    if (dto.isActive !== undefined) {
      payload.isActive = dto.isActive;
    }

    return payload;
  }

  private nullableString(value: string | null | undefined) {
    const trimmedValue = value?.trim() ?? '';
    return trimmedValue || null;
  }

  private nullableNumber(value: number | string | null | undefined) {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    const numericValue = Number(value);
    return Number.isInteger(numericValue) && numericValue > 0 ? numericValue : null;
  }

  private resolveCountryName(name: string | null | undefined, idByName: Map<string, number>) {
    const normalizedName = name?.trim().toLowerCase() ?? '';
    return normalizedName ? idByName.get(normalizedName) ?? null : null;
  }

  private normalizeBuyerIdentityKey(name: string | null | undefined, displayName: string | null | undefined) {
    const normalizedName = name?.trim().toLowerCase();
    const normalizedDisplayName = displayName?.trim().toLowerCase();

    if (!normalizedName || !normalizedDisplayName) {
      return null;
    }

    return `${normalizedName}::${normalizedDisplayName}`;
  }

  private async ensureBuyerIdentityPairUnique(
    name: string | null | undefined,
    displayName: string | null | undefined,
    organizationId: string,
    ignoreId?: string,
  ) {
    const identityKey = this.normalizeBuyerIdentityKey(name, displayName);

    if (!identityKey) {
      return;
    }

    const queryBuilder = this.buyerRepository
      .createQueryBuilder('buyer')
      .withDeleted()
      .where('buyer.organization_id = :organizationId', { organizationId })
      .andWhere('LOWER(TRIM(buyer.name)) = :name', {
        name: name?.trim().toLowerCase(),
      })
      .andWhere('LOWER(TRIM(buyer.displayName)) = :displayName', {
        displayName: displayName?.trim().toLowerCase(),
      });

    if (ignoreId !== undefined) {
      queryBuilder.andWhere('buyer.id != :ignoreId', { ignoreId });
    }

    const existing = await queryBuilder.getOne();

    if (existing) {
      throw new BadRequestException('Buyer already exists');
    }
  }

  private throwMissingSetupError(countries: Set<string>, totalRows: number) {
    const missing = {
      countries: [...countries],
    };

    if (!missing.countries.length) {
      return;
    }

    throw new BadRequestException({
      message: 'Buyer upload could not be completed because required setup data is missing. Please add the missing setup records first, then upload the template again.',
      uploadReport: {
        inserted: 0,
        skipped: totalRows,
        missing,
      },
    });
  }

  private parseBuyerTemplate(content: string) {
    const lines = content
      .replace(/^\uFEFF/, '')
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    if (lines.length === 0) {
      throw new BadRequestException('The uploaded template does not contain any buyer rows.');
    }

    if (lines.length === 1) {
      return [];
    }

    const headers = this.parseCsvLine(lines[0]).map((header) => header.trim().toLowerCase());
    const nameIndex = headers.indexOf('name');
    const displayNameIndex = headers.indexOf('displayname');
    const contactIndex = headers.indexOf('contact');
    const emailIndex = headers.indexOf('email');
    const countryNameIndex = headers.indexOf('countryname');
    const addressIndex = headers.indexOf('address');
    const isActiveIndex = headers.indexOf('isactive');
    const remarksIndex = headers.indexOf('remarks');

    if (
      nameIndex === -1 ||
      displayNameIndex === -1 ||
      isActiveIndex === -1
    ) {
      throw new BadRequestException('The uploaded template must include name, displayName, and isActive columns.');
    }

    return lines.slice(1).flatMap((line) => {
      const columns = this.parseCsvLine(line);
      const name = columns[nameIndex]?.trim() ?? '';
      const displayName = columns[displayNameIndex]?.trim() ?? '';
      const contact = contactIndex === -1 ? null : columns[contactIndex]?.trim() || null;
      const email = emailIndex === -1 ? null : columns[emailIndex]?.trim() || null;
      const address = addressIndex === -1 ? null : columns[addressIndex]?.trim() || null;
      const countryName = countryNameIndex === -1 ? null : columns[countryNameIndex]?.trim() || null;
      const remarks = remarksIndex === -1 ? '' : columns[remarksIndex]?.trim() ?? '';
      const isActive = this.parseBoolean(columns[isActiveIndex]);

      if (!name || !displayName) {
        return [];
      }

      return [
        {
          name,
          displayName,
          contact,
          email,
          countryName,
          address,
          remarks: remarks || null,
          isActive,
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

  private parseBoolean(value?: string | null) {
    const normalizedValue = value?.trim().toLowerCase();

    if (!normalizedValue) {
      return true;
    }

    return ['true', 'yes', 'y', '1', 'active'].includes(normalizedValue);
  }

  private async ensureBuyerExists(id: string, organizationId: string, includeDeleted = false) {
    const queryBuilder = this.buyerRepository
      .createQueryBuilder('buyer')
      .where('buyer.id = :id', { id })
      .andWhere('buyer.organization_id = :organizationId', { organizationId });

    if (includeDeleted) {
      queryBuilder.withDeleted();
    } else {
      queryBuilder.andWhere('buyer.deleted_at IS NULL');
    }

    const buyer = await queryBuilder.getOne();

    if (!buyer) {
      throw new NotFoundException('Buyer not found in the selected organization.');
    }

    return buyer;
  }

  private normalizeUpdatedAt<T extends { updated_at?: Date | null; updated_by_id?: string | null; updated_by_user?: unknown } | null>(value: T): T {
    if (!value) {
      return value;
    }

    if (!value.updated_by_id && !value.updated_by_user) {
      value.updated_at = null;
    }

    return value;
  }

  private normalizeUpdatedAtList<T extends { updated_at?: Date | null; updated_by_id?: string | null; updated_by_user?: unknown }>(values: T[]): T[] {
    return values.map((value) => this.normalizeUpdatedAt(value));
  }
}
