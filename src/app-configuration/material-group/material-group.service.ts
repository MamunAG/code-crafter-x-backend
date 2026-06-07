import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { PaginatedResponseDto } from 'src/common/dto/paginated-response.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { CreateMaterialGroupDto } from './dto/create-material-group.dto';
import { FilterMaterialGroupDto } from './dto/filter-material-group.dto';
import { UpdateMaterialGroupDto } from './dto/update-material-group.dto';
import { MaterialGroup } from './entity/material-group.entity';

type MaterialGroupListFilters = Partial<FilterMaterialGroupDto> & {
  deletedOnly?: string | boolean;
};

@Injectable()
export class MaterialGroupService {
  constructor(
    @InjectRepository(MaterialGroup)
    private readonly materialGroupRepository: Repository<MaterialGroup>,
  ) {}

  async create(dto: CreateMaterialGroupDto, organizationId: string) {
    const normalizedGroup = this.normalizeMaterialGroupPayload(dto);
    await this.ensureMaterialGroupIsUnique(
      normalizedGroup.name,
      organizationId,
    );

    const group = this.materialGroupRepository.create({
      ...normalizedGroup,
      organizationId,
    });
    const saved = await this.materialGroupRepository.save(group);

    await this.materialGroupRepository
      .createQueryBuilder()
      .update(MaterialGroup)
      .set({
        updated_by_id: null,
        updated_at: () => 'NULL',
      } as unknown as Partial<MaterialGroup>)
      .where('id = :id', { id: saved.id })
      .andWhere('organization_id = :organizationId', { organizationId })
      .execute();

    return this.normalizeUpdatedAt(await this.findOne(saved.id, organizationId));
  }

  buildUploadTemplate() {
    return [
      'name,description,isActive',
      'Fabric,Fabric and textile materials,true',
    ].join('\n');
  }

  async importFromTemplate(
    file: Express.Multer.File | undefined,
    userId: string,
    organizationId: string,
  ) {
    if (!file?.buffer?.length) {
      throw new BadRequestException(
        'Please upload a material group template file.',
      );
    }

    const rows = this.parseMaterialGroupTemplate(file.buffer.toString('utf8'));

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
    const existingGroups =
      uniqueNames.length
        ? await this.materialGroupRepository
            .createQueryBuilder('materialGroup')
            .withDeleted()
            .select(['materialGroup.name'])
            .where('materialGroup.organization_id = :organizationId', {
              organizationId,
            })
            .andWhere('LOWER(TRIM(materialGroup.name)) IN (:...names)', {
              names: uniqueNames.length ? uniqueNames : [''],
            })
            .getMany()
        : [];

    const existingIdentitySet = new Set(
      existingGroups
        .map((group) => group.name?.trim().toLowerCase() || '')
        .filter((value): value is string => Boolean(value)),
    );
    const seenIdentitySet = new Set<string>();

    const groupsToCreate = rows
      .filter((row) => {
        const normalizedName = row.name.trim().toLowerCase();

        if (!normalizedName) return false;
        if (existingIdentitySet.has(normalizedName)) return false;
        if (seenIdentitySet.has(normalizedName)) return false;

        seenIdentitySet.add(normalizedName);
        return true;
      })
      .map((row) =>
        this.materialGroupRepository.create({
          name: row.name.trim(),
          description: row.description?.trim() || null,
          isActive: row.isActive,
          organizationId,
          created_by_id: userId,
          updated_by_id: null as unknown as string,
          updated_at: null as unknown as Date,
        }),
      );

    if (!groupsToCreate.length) {
      return {
        inserted: 0,
        skipped: rows.length,
      };
    }

    const savedGroups = await this.materialGroupRepository.save(groupsToCreate);
    await this.materialGroupRepository
      .createQueryBuilder()
      .update(MaterialGroup)
      .set({
        updated_by_id: null,
        updated_at: () => 'NULL',
      } as unknown as Partial<MaterialGroup>)
      .where('id IN (:...ids)', {
        ids: savedGroups.map((group) => group.id),
      })
      .execute();

    return {
      inserted: savedGroups.length,
      skipped: rows.length - savedGroups.length,
    };
  }

  async findAll(
    paginationDto: PaginationDto,
    filters?: MaterialGroupListFilters,
    organizationId?: string,
  ): Promise<PaginatedResponseDto<MaterialGroup>> {
    const { page = 1, limit = 1000000000000 } = paginationDto;
    const deletedOnly =
      filters?.deletedOnly === true || filters?.deletedOnly === 'true';
    const skip = (page - 1) * limit;

    const queryBuilder = this.materialGroupRepository
      .createQueryBuilder('materialGroup')
      .leftJoinAndSelect('materialGroup.created_by_user', 'created_by_user')
      .leftJoinAndSelect('materialGroup.updated_by_user', 'updated_by_user')
      .leftJoinAndSelect('materialGroup.deleted_by_user', 'deleted_by_user')
      .where('materialGroup.organization_id = :organizationId', {
        organizationId,
      })
      .skip(skip)
      .take(limit)
      .orderBy('materialGroup.name', 'ASC')
      .addOrderBy('materialGroup.created_at', 'DESC');

    if (deletedOnly) queryBuilder.withDeleted();

    if (filters?.name) {
      queryBuilder.andWhere('materialGroup.name ILIKE :name', {
        name: `%${filters.name}%`,
      });
    }

    if (filters?.description) {
      queryBuilder.andWhere('materialGroup.description ILIKE :description', {
        description: `%${filters.description}%`,
      });
    }

    if (filters?.isActive !== undefined && filters?.isActive !== '') {
      queryBuilder.andWhere('materialGroup.isActive = :isActive', {
        isActive: this.parseBoolean(filters.isActive),
      });
    }

    if (deletedOnly) {
      queryBuilder.andWhere('materialGroup.deleted_at IS NOT NULL');
    } else {
      queryBuilder.andWhere('materialGroup.deleted_at IS NULL');
    }

    const [items, total] = await queryBuilder.getManyAndCount();
    const totalPages = Math.ceil(total / limit);

    return {
      items: this.normalizeUpdatedAtList(items),
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  findOne(id: string, organizationId: string) {
    return this.materialGroupRepository
      .createQueryBuilder('materialGroup')
      .leftJoinAndSelect('materialGroup.created_by_user', 'created_by_user')
      .leftJoinAndSelect('materialGroup.updated_by_user', 'updated_by_user')
      .leftJoinAndSelect('materialGroup.deleted_by_user', 'deleted_by_user')
      .where('materialGroup.organization_id = :organizationId', {
        organizationId,
      })
      .andWhere('materialGroup.id = :id', { id })
      .andWhere('materialGroup.deleted_at IS NULL')
      .getOne()
      .then((group) => {
        if (!group) {
          throw new NotFoundException(
            'Material group not found in the selected organization.',
          );
        }

        return this.normalizeUpdatedAt(group);
      });
  }

  async update(id: string, dto: UpdateMaterialGroupDto, organizationId: string) {
    const normalizedGroup = this.normalizeMaterialGroupPayload(dto);
    if (normalizedGroup.name) {
      await this.ensureMaterialGroupIsUnique(
        normalizedGroup.name,
        organizationId,
        id,
      );
    }

    const group = await this.materialGroupRepository.findOne({
      where: { id, organizationId },
      withDeleted: false,
    });

    if (!group) {
      throw new NotFoundException(
        'Material group not found in the selected organization.',
      );
    }

    Object.assign(group, normalizedGroup);
    await this.materialGroupRepository.save(group);

    return this.normalizeUpdatedAt(await this.findOne(id, organizationId));
  }

  async remove(id: string, deletedById: string, organizationId: string) {
    await this.ensureMaterialGroupExists(id, organizationId);
    await this.materialGroupRepository.update(
      { id, organizationId },
      { deleted_by_id: deletedById },
    );
    return this.materialGroupRepository.softDelete({ id, organizationId });
  }

  async permanentRemove(id: string, organizationId: string) {
    await this.ensureMaterialGroupExists(id, organizationId, true);
    return this.materialGroupRepository.delete({ id, organizationId });
  }

  async restore(id: string, organizationId: string) {
    await this.ensureMaterialGroupExists(id, organizationId, true);
    return this.materialGroupRepository.restore({ id, organizationId });
  }

  private async ensureMaterialGroupIsUnique(
    name?: string | null,
    organizationId?: string,
    ignoreId?: string,
  ) {
    const normalizedName = name?.trim().toLowerCase();

    if (!normalizedName) return;

    const queryBuilder = this.materialGroupRepository
      .createQueryBuilder('materialGroup')
      .where('materialGroup.organization_id = :organizationId', {
        organizationId,
      })
      .andWhere('materialGroup.deleted_at IS NULL');

    queryBuilder.andWhere('LOWER(TRIM(materialGroup.name)) = :name', {
      name: normalizedName,
    });

    if (ignoreId !== undefined) {
      queryBuilder.andWhere('materialGroup.id != :ignoreId', { ignoreId });
    }

    const existing = await queryBuilder.getOne();

    if (existing) {
      throw new BadRequestException('Material group already exists');
    }
  }

  private normalizeMaterialGroupPayload(
    dto: Partial<CreateMaterialGroupDto>,
  ): Partial<MaterialGroup> {
    const payload: Partial<MaterialGroup> = {};

    if (dto.name !== undefined) payload.name = dto.name.trim();
    if ('description' in dto) {
      payload.description = this.nullableString(dto.description);
    }
    if (dto.isActive !== undefined) payload.isActive = dto.isActive;

    return payload;
  }

  private parseMaterialGroupTemplate(content: string) {
    const lines = content
      .replace(/^\uFEFF/, '')
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    if (lines.length === 0) {
      throw new BadRequestException(
        'The uploaded template does not contain any material group rows.',
      );
    }

    if (lines.length === 1) return [];

    const headers = this.parseCsvLine(lines[0]).map((header) =>
      header.trim().toLowerCase(),
    );
    const nameIndex = headers.indexOf('name');
    const descriptionIndex = headers.indexOf('description');
    const activeIndex = headers.indexOf('isactive');

    if (nameIndex === -1) {
      throw new BadRequestException(
        'The uploaded template must include a name column.',
      );
    }

    return lines.slice(1).flatMap((line) => {
      const columns = this.parseCsvLine(line);
      const name = columns[nameIndex]?.trim() ?? '';

      if (!name) return [];

      return [
        {
          name,
          description:
            descriptionIndex === -1
              ? ''
              : columns[descriptionIndex]?.trim() ?? '',
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

  private async ensureMaterialGroupExists(
    id: string,
    organizationId: string,
    includeDeleted = false,
  ) {
    const queryBuilder = this.materialGroupRepository
      .createQueryBuilder('materialGroup')
      .where('materialGroup.id = :id', { id })
      .andWhere('materialGroup.organization_id = :organizationId', {
        organizationId,
      });

    if (includeDeleted) {
      queryBuilder.withDeleted();
    } else {
      queryBuilder.andWhere('materialGroup.deleted_at IS NULL');
    }

    const group = await queryBuilder.getOne();

    if (!group) {
      throw new NotFoundException(
        'Material group not found in the selected organization.',
      );
    }

    return group;
  }

  private parseBoolean(value?: string | null) {
    const normalizedValue = value?.trim().toLowerCase();

    if (!normalizedValue) return true;

    return ['true', 'yes', 'y', '1', 'active'].includes(normalizedValue);
  }

  private normalizeUpdatedAt<
    T extends {
      updated_at?: Date | null;
      updated_by_id?: string | null;
      updated_by_user?: unknown;
    } | null,
  >(value: T): T {
    if (!value) return value;

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
