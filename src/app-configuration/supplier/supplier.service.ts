import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { PaginatedResponseDto } from 'src/common/dto/paginated-response.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { FilterSupplierDto } from './dto/filter-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { Supplier } from './entity/supplier.entity';

type SupplierListFilters = Partial<FilterSupplierDto> & {
  deletedOnly?: string | boolean;
};

@Injectable()
export class SupplierService {
  constructor(
    @InjectRepository(Supplier)
    private readonly supplierRepository: Repository<Supplier>,
  ) {}

  async create(supplierDto: CreateSupplierDto, organizationId: string) {
    const normalizedSupplier = this.normalizeSupplierPayload(supplierDto);
    await this.ensureSupplierIsUnique(
      normalizedSupplier.name,
      normalizedSupplier.code,
      organizationId,
    );

    const supplier = this.supplierRepository.create({
      ...normalizedSupplier,
      organizationId,
    });

    const saved = await this.supplierRepository.save(supplier);

    await this.supplierRepository
      .createQueryBuilder()
      .update(Supplier)
      .set({
        updated_by_id: null,
        updated_at: () => 'NULL',
      } as unknown as Partial<Supplier>)
      .where('id = :id', { id: saved.id })
      .andWhere('organization_id = :organizationId', { organizationId })
      .execute();

    return this.normalizeUpdatedAt(
      await this.findOne(saved.id, organizationId),
    );
  }

  buildUploadTemplate() {
    return [
      'name,code,contact,email,address,remarks,isActive',
      'ABC Suppliers Ltd.,SUP-001,+8801712345678,supplier@example.com,"Dhaka, Bangladesh",Primary fabric supplier.,true',
    ].join('\n');
  }

  async importFromTemplate(
    file: Express.Multer.File | undefined,
    userId: string,
    organizationId: string,
  ) {
    if (!file?.buffer?.length) {
      throw new BadRequestException(
        'Please upload a supplier template file.',
      );
    }

    const rows = this.parseSupplierTemplate(file.buffer.toString('utf8'));

    if (!rows.length) {
      return {
        inserted: 0,
        skipped: 0,
      };
    }

    const uniqueNames = [
      ...new Set(
        rows
          .map((row) => row.name.trim().toLowerCase())
          .filter((value): value is string => Boolean(value)),
      ),
    ];
    const uniqueCodes = [
      ...new Set(
        rows
          .map((row) => row.code?.trim().toLowerCase())
          .filter((value): value is string => Boolean(value)),
      ),
    ];

    const existingSuppliers =
      uniqueNames.length || uniqueCodes.length
        ? await this.supplierRepository
            .createQueryBuilder('supplier')
            .withDeleted()
            .select(['supplier.name', 'supplier.code'])
            .where('supplier.organization_id = :organizationId', {
              organizationId,
            })
            .andWhere(
              uniqueNames.length && uniqueCodes.length
                ? '(LOWER(TRIM(supplier.name)) IN (:...names) OR LOWER(TRIM(supplier.code)) IN (:...codes))'
                : uniqueNames.length
                  ? 'LOWER(TRIM(supplier.name)) IN (:...names)'
                  : 'LOWER(TRIM(supplier.code)) IN (:...codes)',
              {
                names: uniqueNames.length ? uniqueNames : [''],
                codes: uniqueCodes.length ? uniqueCodes : [''],
              },
            )
            .getMany()
        : [];

    const existingIdentitySet = new Set(
      existingSuppliers
        .flatMap((supplier) => [
          supplier.name?.trim().toLowerCase() || '',
          supplier.code?.trim().toLowerCase() || '',
        ])
        .filter((value): value is string => Boolean(value)),
    );
    const seenIdentitySet = new Set<string>();

    const suppliersToCreate = rows
      .filter((row) => {
        const normalizedName = row.name.trim().toLowerCase();
        const normalizedCode = row.code?.trim().toLowerCase() || '';
        const identityKey = normalizedCode || normalizedName;

        if (!normalizedName) {
          return false;
        }

        if (existingIdentitySet.has(normalizedName)) {
          return false;
        }

        if (normalizedCode && existingIdentitySet.has(normalizedCode)) {
          return false;
        }

        if (seenIdentitySet.has(identityKey)) {
          return false;
        }

        seenIdentitySet.add(identityKey);
        return true;
      })
      .map((row) =>
        this.supplierRepository.create({
          name: row.name.trim(),
          code: row.code?.trim() || null,
          contact: row.contact?.trim() || null,
          email: row.email?.trim() || null,
          address: row.address?.trim() || null,
          remarks: row.remarks?.trim() || null,
          isActive: row.isActive,
          organizationId,
          created_by_id: userId,
          updated_by_id: null as unknown as string,
          updated_at: null as unknown as Date,
        }),
      );

    if (!suppliersToCreate.length) {
      return {
        inserted: 0,
        skipped: rows.length,
      };
    }

    const savedSuppliers = await this.supplierRepository.save(suppliersToCreate);
    await this.supplierRepository
      .createQueryBuilder()
      .update(Supplier)
      .set({
        updated_by_id: null,
        updated_at: () => 'NULL',
      } as unknown as Partial<Supplier>)
      .where('id IN (:...ids)', { ids: savedSuppliers.map((supplier) => supplier.id) })
      .execute();

    return {
      inserted: savedSuppliers.length,
      skipped: rows.length - savedSuppliers.length,
    };
  }

  async findAll(
    paginationDto: PaginationDto,
    filters?: SupplierListFilters,
    organizationId?: string,
  ): Promise<PaginatedResponseDto<Supplier>> {
    const { page = 1, limit = 1000000000000 } = paginationDto;
    const deletedOnly =
      filters?.deletedOnly === true || filters?.deletedOnly === 'true';
    const skip = (page - 1) * limit;

    const queryBuilder = this.supplierRepository
      .createQueryBuilder('supplier')
      .leftJoinAndSelect('supplier.created_by_user', 'created_by_user')
      .leftJoinAndSelect('supplier.updated_by_user', 'updated_by_user')
      .leftJoinAndSelect('supplier.deleted_by_user', 'deleted_by_user')
      .where('supplier.organization_id = :organizationId', { organizationId })
      .skip(skip)
      .take(limit)
      .orderBy(
        deletedOnly ? 'supplier.deleted_at' : 'supplier.created_at',
        'DESC',
      );

    if (deletedOnly) {
      queryBuilder.withDeleted();
    }

    if (filters?.name) {
      queryBuilder.andWhere('supplier.name ILIKE :name', {
        name: `%${filters.name}%`,
      });
    }

    if (filters?.code) {
      queryBuilder.andWhere('supplier.code ILIKE :code', {
        code: `%${filters.code}%`,
      });
    }

    if (filters?.contact) {
      queryBuilder.andWhere('supplier.contact ILIKE :contact', {
        contact: `%${filters.contact}%`,
      });
    }

    if (filters?.email) {
      queryBuilder.andWhere('supplier.email ILIKE :email', {
        email: `%${filters.email}%`,
      });
    }

    if (filters?.address) {
      queryBuilder.andWhere('supplier.address ILIKE :address', {
        address: `%${filters.address}%`,
      });
    }

    if (filters?.remarks) {
      queryBuilder.andWhere('supplier.remarks ILIKE :remarks', {
        remarks: `%${filters.remarks}%`,
      });
    }

    if (filters?.isActive !== undefined && filters?.isActive !== '') {
      queryBuilder.andWhere('supplier.isActive = :isActive', {
        isActive: this.parseBoolean(filters.isActive),
      });
    }

    if (deletedOnly) {
      queryBuilder.andWhere('supplier.deleted_at IS NOT NULL');
    } else {
      queryBuilder.andWhere('supplier.deleted_at IS NULL');
    }

    const [items, total] = await queryBuilder.getManyAndCount();

    return {
      items: this.normalizeUpdatedAtList(items),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPreviousPage: page > 1,
      },
    };
  }

  findOne(id: string, organizationId: string) {
    return this.supplierRepository
      .createQueryBuilder('supplier')
      .leftJoinAndSelect('supplier.created_by_user', 'created_by_user')
      .leftJoinAndSelect('supplier.updated_by_user', 'updated_by_user')
      .leftJoinAndSelect('supplier.deleted_by_user', 'deleted_by_user')
      .where('supplier.organization_id = :organizationId', { organizationId })
      .andWhere('supplier.id = :id', { id })
      .andWhere('supplier.deleted_at IS NULL')
      .getOne()
      .then((supplier) => {
        if (!supplier) {
          throw new NotFoundException(
            'Supplier not found in the selected organization.',
          );
        }

        return this.normalizeUpdatedAt(supplier);
      });
  }

  async update(id: string, dto: UpdateSupplierDto, organizationId: string) {
    const normalizedSupplier = this.normalizeSupplierPayload(dto);
    if (normalizedSupplier.name || normalizedSupplier.code) {
      await this.ensureSupplierIsUnique(
        normalizedSupplier.name,
        normalizedSupplier.code,
        organizationId,
        id,
      );
    }

    const supplier = await this.supplierRepository.findOne({
      where: { id, organizationId },
      withDeleted: false,
    });

    if (!supplier) {
      throw new NotFoundException(
        'Supplier not found in the selected organization.',
      );
    }

    Object.assign(supplier, normalizedSupplier);
    await this.supplierRepository.save(supplier);

    return this.normalizeUpdatedAt(await this.findOne(id, organizationId));
  }

  async remove(id: string, deletedById: string, organizationId: string) {
    await this.ensureSupplierExists(id, organizationId);
    await this.supplierRepository.update(
      { id, organizationId },
      { deleted_by_id: deletedById },
    );
    return this.supplierRepository.softDelete({ id, organizationId });
  }

  async permanentRemove(id: string, organizationId: string) {
    await this.ensureSupplierExists(id, organizationId, true);
    return this.supplierRepository.delete({ id, organizationId });
  }

  async restore(id: string, organizationId: string) {
    await this.ensureSupplierExists(id, organizationId, true);
    return this.supplierRepository.restore({ id, organizationId });
  }

  private async ensureSupplierIsUnique(
    name?: string | null,
    code?: string | null,
    organizationId?: string,
    ignoreId?: string,
  ) {
    const normalizedName = name?.trim().toLowerCase();
    const normalizedCode = code?.trim().toLowerCase();

    if (!normalizedName && !normalizedCode) {
      return;
    }

    const queryBuilder = this.supplierRepository
      .createQueryBuilder('supplier')
      .where('supplier.organization_id = :organizationId', { organizationId })
      .andWhere('supplier.deleted_at IS NULL');

    if (normalizedName && normalizedCode) {
      queryBuilder.andWhere(
        '(LOWER(TRIM(supplier.name)) = :name OR LOWER(TRIM(supplier.code)) = :code)',
        {
          name: normalizedName,
          code: normalizedCode,
        },
      );
    } else if (normalizedName) {
      queryBuilder.andWhere('LOWER(TRIM(supplier.name)) = :name', {
        name: normalizedName,
      });
    } else if (normalizedCode) {
      queryBuilder.andWhere('LOWER(TRIM(supplier.code)) = :code', {
        code: normalizedCode,
      });
    }

    if (ignoreId !== undefined) {
      queryBuilder.andWhere('supplier.id != :ignoreId', { ignoreId });
    }

    const existing = await queryBuilder.getOne();

    if (existing) {
      throw new BadRequestException('Supplier already exists');
    }
  }

  private normalizeSupplierPayload(
    dto: Partial<CreateSupplierDto>,
  ): Partial<Supplier> {
    const payload: Partial<Supplier> = {};

    if (dto.name !== undefined) payload.name = dto.name.trim();
    if ('code' in dto) payload.code = this.nullableString(dto.code);
    if ('contact' in dto) payload.contact = this.nullableString(dto.contact);
    if ('email' in dto)
      payload.email = this.nullableString(dto.email)?.toLowerCase() ?? null;
    if ('address' in dto) payload.address = this.nullableString(dto.address);
    if ('remarks' in dto) payload.remarks = this.nullableString(dto.remarks);
    if (dto.isActive !== undefined) payload.isActive = dto.isActive;

    return payload;
  }

  private parseSupplierTemplate(content: string) {
    const lines = content
      .replace(/^\uFEFF/, '')
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    if (lines.length === 0) {
      throw new BadRequestException(
        'The uploaded template does not contain any supplier rows.',
      );
    }

    if (lines.length === 1) {
      return [];
    }

    const headers = this.parseCsvLine(lines[0]).map((header) =>
      header.trim().toLowerCase(),
    );
    const nameIndex = headers.indexOf('name');
    const codeIndex = headers.indexOf('code');
    const contactIndex = headers.indexOf('contact');
    const emailIndex = headers.indexOf('email');
    const addressIndex = headers.indexOf('address');
    const remarksIndex = headers.indexOf('remarks');
    const activeIndex = headers.indexOf('isactive');

    if (nameIndex === -1) {
      throw new BadRequestException(
        'The uploaded template must include a name column.',
      );
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
          code: codeIndex === -1 ? '' : columns[codeIndex]?.trim() ?? '',
          contact: contactIndex === -1 ? '' : columns[contactIndex]?.trim() ?? '',
          email: emailIndex === -1 ? '' : columns[emailIndex]?.trim() ?? '',
          address: addressIndex === -1 ? '' : columns[addressIndex]?.trim() ?? '',
          remarks: remarksIndex === -1 ? '' : columns[remarksIndex]?.trim() ?? '',
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

  private nullableString(value: string | null | undefined) {
    const trimmedValue = value?.trim() ?? '';
    return trimmedValue || null;
  }

  private async ensureSupplierExists(
    id: string,
    organizationId: string,
    includeDeleted = false,
  ) {
    const queryBuilder = this.supplierRepository
      .createQueryBuilder('supplier')
      .where('supplier.id = :id', { id })
      .andWhere('supplier.organization_id = :organizationId', {
        organizationId,
      });

    if (includeDeleted) {
      queryBuilder.withDeleted();
    } else {
      queryBuilder.andWhere('supplier.deleted_at IS NULL');
    }

    const supplier = await queryBuilder.getOne();

    if (!supplier) {
      throw new NotFoundException(
        'Supplier not found in the selected organization.',
      );
    }

    return supplier;
  }

  private parseBoolean(value?: string | null) {
    const normalizedValue = value?.trim().toLowerCase();

    if (!normalizedValue) {
      return true;
    }

    return ['true', 'yes', 'y', '1', 'active'].includes(normalizedValue);
  }

  private normalizeUpdatedAt<
    T extends {
      updated_at?: Date | null;
      updated_by_id?: string | null;
      updated_by_user?: unknown;
    } | null,
  >(value: T): T {
    if (!value) {
      return value;
    }

    if (!value.updated_by_id && !value.updated_by_user) {
      value.updated_at = null;
    }

    return value;
  }

  private normalizeUpdatedAtList<
    T extends {
      updated_at?: Date | null;
      updated_by_id?: string | null;
      updated_by_user?: unknown;
    },
  >(values: T[]): T[] {
    return values.map((value) => this.normalizeUpdatedAt(value));
  }
}
