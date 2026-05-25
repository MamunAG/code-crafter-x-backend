import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { PaginatedResponseDto } from 'src/common/dto/paginated-response.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { CreateMaterialDto } from './dto/create-material.dto';
import { FilterMaterialDto } from './dto/filter-material.dto';
import { UpdateMaterialDto } from './dto/update-material.dto';
import { Material } from './entity/material.entity';

type MaterialListFilters = Partial<FilterMaterialDto> & {
  deletedOnly?: string | boolean;
};

@Injectable()
export class MaterialService {
  constructor(
    @InjectRepository(Material)
    private readonly materialRepository: Repository<Material>,
  ) {}

  async create(materialDto: CreateMaterialDto, organizationId: string) {
    const normalizedMaterial = this.normalizeMaterialPayload(materialDto);
    await this.ensureMaterialIsUnique(
      normalizedMaterial.name,
      normalizedMaterial.code,
      organizationId,
    );

    const material = this.materialRepository.create({
      ...normalizedMaterial,
      organizationId,
    });

    const saved = await this.materialRepository.save(material);

    await this.materialRepository
      .createQueryBuilder()
      .update(Material)
      .set({
        updated_by_id: null,
        updated_at: () => 'NULL',
      } as unknown as Partial<Material>)
      .where('id = :id', { id: saved.id })
      .andWhere('organization_id = :organizationId', { organizationId })
      .execute();

    return this.normalizeUpdatedAt(
      await this.findOne(saved.id, organizationId),
    );
  }

  buildUploadTemplate() {
    return [
      'name,code,description,remarks,isActive',
      'Cotton Fabric,MAT-001,100% cotton single jersey fabric,Preferred for summer programs.,true',
    ].join('\n');
  }

  async importFromTemplate(
    file: Express.Multer.File | undefined,
    userId: string,
    organizationId: string,
  ) {
    if (!file?.buffer?.length) {
      throw new BadRequestException('Please upload a material template file.');
    }

    const rows = this.parseMaterialTemplate(file.buffer.toString('utf8'));

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

    const existingMaterials =
      uniqueNames.length || uniqueCodes.length
        ? await this.materialRepository
            .createQueryBuilder('material')
            .withDeleted()
            .select(['material.name', 'material.code'])
            .where('material.organization_id = :organizationId', {
              organizationId,
            })
            .andWhere(
              uniqueNames.length && uniqueCodes.length
                ? '(LOWER(TRIM(material.name)) IN (:...names) OR LOWER(TRIM(material.code)) IN (:...codes))'
                : uniqueNames.length
                  ? 'LOWER(TRIM(material.name)) IN (:...names)'
                  : 'LOWER(TRIM(material.code)) IN (:...codes)',
              {
                names: uniqueNames.length ? uniqueNames : [''],
                codes: uniqueCodes.length ? uniqueCodes : [''],
              },
            )
            .getMany()
        : [];

    const existingIdentitySet = new Set(
      existingMaterials
        .flatMap((material) => [
          material.name?.trim().toLowerCase() || '',
          material.code?.trim().toLowerCase() || '',
        ])
        .filter((value): value is string => Boolean(value)),
    );
    const seenIdentitySet = new Set<string>();

    const materialsToCreate = rows
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
        this.materialRepository.create({
          name: row.name.trim(),
          code: row.code?.trim() || null,
          description: row.description?.trim() || null,
          remarks: row.remarks?.trim() || null,
          isActive: row.isActive,
          organizationId,
          created_by_id: userId,
          updated_by_id: null as unknown as string,
          updated_at: null as unknown as Date,
        }),
      );

    if (!materialsToCreate.length) {
      return {
        inserted: 0,
        skipped: rows.length,
      };
    }

    const savedMaterials =
      await this.materialRepository.save(materialsToCreate);
    await this.materialRepository
      .createQueryBuilder()
      .update(Material)
      .set({
        updated_by_id: null,
        updated_at: () => 'NULL',
      } as unknown as Partial<Material>)
      .where('id IN (:...ids)', {
        ids: savedMaterials.map((material) => material.id),
      })
      .execute();

    return {
      inserted: savedMaterials.length,
      skipped: rows.length - savedMaterials.length,
    };
  }

  async findAll(
    paginationDto: PaginationDto,
    filters?: MaterialListFilters,
    organizationId?: string,
  ): Promise<PaginatedResponseDto<Material>> {
    const { page = 1, limit = 1000000000000 } = paginationDto;
    const deletedOnly =
      filters?.deletedOnly === true || filters?.deletedOnly === 'true';
    const skip = (page - 1) * limit;

    const queryBuilder = this.materialRepository
      .createQueryBuilder('material')
      .leftJoinAndSelect('material.created_by_user', 'created_by_user')
      .leftJoinAndSelect('material.updated_by_user', 'updated_by_user')
      .leftJoinAndSelect('material.deleted_by_user', 'deleted_by_user')
      .where('material.organization_id = :organizationId', { organizationId })
      .skip(skip)
      .take(limit)
      .orderBy(
        deletedOnly ? 'material.deleted_at' : 'material.created_at',
        'DESC',
      );

    if (deletedOnly) {
      queryBuilder.withDeleted();
    }

    if (filters?.name) {
      queryBuilder.andWhere('material.name ILIKE :name', {
        name: `%${filters.name}%`,
      });
    }

    if (filters?.code) {
      queryBuilder.andWhere('material.code ILIKE :code', {
        code: `%${filters.code}%`,
      });
    }

    if (filters?.description) {
      queryBuilder.andWhere('material.description ILIKE :description', {
        description: `%${filters.description}%`,
      });
    }

    if (filters?.remarks) {
      queryBuilder.andWhere('material.remarks ILIKE :remarks', {
        remarks: `%${filters.remarks}%`,
      });
    }

    if (filters?.isActive !== undefined && filters?.isActive !== '') {
      queryBuilder.andWhere('material.isActive = :isActive', {
        isActive: this.parseBoolean(filters.isActive),
      });
    }

    if (deletedOnly) {
      queryBuilder.andWhere('material.deleted_at IS NOT NULL');
    } else {
      queryBuilder.andWhere('material.deleted_at IS NULL');
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
    return this.materialRepository
      .createQueryBuilder('material')
      .leftJoinAndSelect('material.created_by_user', 'created_by_user')
      .leftJoinAndSelect('material.updated_by_user', 'updated_by_user')
      .leftJoinAndSelect('material.deleted_by_user', 'deleted_by_user')
      .where('material.organization_id = :organizationId', { organizationId })
      .andWhere('material.id = :id', { id })
      .andWhere('material.deleted_at IS NULL')
      .getOne()
      .then((material) => {
        if (!material) {
          throw new NotFoundException(
            'Material not found in the selected organization.',
          );
        }

        return this.normalizeUpdatedAt(material);
      });
  }

  async update(id: string, dto: UpdateMaterialDto, organizationId: string) {
    const normalizedMaterial = this.normalizeMaterialPayload(dto);
    if (normalizedMaterial.name || normalizedMaterial.code) {
      await this.ensureMaterialIsUnique(
        normalizedMaterial.name,
        normalizedMaterial.code,
        organizationId,
        id,
      );
    }

    const material = await this.materialRepository.findOne({
      where: { id, organizationId },
      withDeleted: false,
    });

    if (!material) {
      throw new NotFoundException(
        'Material not found in the selected organization.',
      );
    }

    Object.assign(material, normalizedMaterial);
    await this.materialRepository.save(material);

    return this.normalizeUpdatedAt(await this.findOne(id, organizationId));
  }

  async remove(id: string, deletedById: string, organizationId: string) {
    await this.ensureMaterialExists(id, organizationId);
    await this.materialRepository.update(
      { id, organizationId },
      { deleted_by_id: deletedById },
    );
    return this.materialRepository.softDelete({ id, organizationId });
  }

  async permanentRemove(id: string, organizationId: string) {
    await this.ensureMaterialExists(id, organizationId, true);
    return this.materialRepository.delete({ id, organizationId });
  }

  async restore(id: string, organizationId: string) {
    await this.ensureMaterialExists(id, organizationId, true);
    return this.materialRepository.restore({ id, organizationId });
  }

  private async ensureMaterialIsUnique(
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

    const queryBuilder = this.materialRepository
      .createQueryBuilder('material')
      .where('material.organization_id = :organizationId', { organizationId })
      .andWhere('material.deleted_at IS NULL');

    if (normalizedName && normalizedCode) {
      queryBuilder.andWhere(
        '(LOWER(TRIM(material.name)) = :name OR LOWER(TRIM(material.code)) = :code)',
        {
          name: normalizedName,
          code: normalizedCode,
        },
      );
    } else if (normalizedName) {
      queryBuilder.andWhere('LOWER(TRIM(material.name)) = :name', {
        name: normalizedName,
      });
    } else if (normalizedCode) {
      queryBuilder.andWhere('LOWER(TRIM(material.code)) = :code', {
        code: normalizedCode,
      });
    }

    if (ignoreId !== undefined) {
      queryBuilder.andWhere('material.id != :ignoreId', { ignoreId });
    }

    const existing = await queryBuilder.getOne();

    if (existing) {
      throw new BadRequestException('Material already exists');
    }
  }

  private normalizeMaterialPayload(
    dto: Partial<CreateMaterialDto>,
  ): Partial<Material> {
    const payload: Partial<Material> = {};

    if (dto.name !== undefined) payload.name = dto.name.trim();
    if ('code' in dto) payload.code = this.nullableString(dto.code);
    if ('description' in dto) {
      payload.description = this.nullableString(dto.description);
    }
    if ('remarks' in dto) payload.remarks = this.nullableString(dto.remarks);
    if (dto.isActive !== undefined) payload.isActive = dto.isActive;

    return payload;
  }

  private parseMaterialTemplate(content: string) {
    const lines = content
      .replace(/^\uFEFF/, '')
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    if (lines.length === 0) {
      throw new BadRequestException(
        'The uploaded template does not contain any material rows.',
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
    const descriptionIndex = headers.indexOf('description');
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
          description:
            descriptionIndex === -1
              ? ''
              : columns[descriptionIndex]?.trim() ?? '',
          remarks:
            remarksIndex === -1 ? '' : columns[remarksIndex]?.trim() ?? '',
          isActive:
            activeIndex === -1
              ? true
              : this.parseBoolean(columns[activeIndex]),
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

  private async ensureMaterialExists(
    id: string,
    organizationId: string,
    includeDeleted = false,
  ) {
    const queryBuilder = this.materialRepository
      .createQueryBuilder('material')
      .where('material.id = :id', { id })
      .andWhere('material.organization_id = :organizationId', {
        organizationId,
      });

    if (includeDeleted) {
      queryBuilder.withDeleted();
    } else {
      queryBuilder.andWhere('material.deleted_at IS NULL');
    }

    const material = await queryBuilder.getOne();

    if (!material) {
      throw new NotFoundException(
        'Material not found in the selected organization.',
      );
    }

    return material;
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
