import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PaginatedResponseDto } from 'src/common/dto/paginated-response.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { Repository } from 'typeorm';
import { CreateModuleEntryDto } from './dto/create-module-entry.dto';
import { FilterModuleEntryDto } from './dto/filter-module-entry.dto';
import { UpdateModuleEntryDto } from './dto/update-module-entry.dto';
import { ModuleEntry } from './entity/module-entry.entity';

@Injectable()
export class ModuleEntryService {
  constructor(
    @InjectRepository(ModuleEntry)
    private readonly moduleEntryRepository: Repository<ModuleEntry>,
  ) {}

  async create(dto: CreateModuleEntryDto) {
    await this.ensureModuleKeyIsUnique(dto.moduleKey);

    const moduleEntry = this.moduleEntryRepository.create({
      ...dto,
      moduleName: dto.moduleName.trim(),
      moduleKey: this.normalizeKey(dto.moduleKey),
      description: this.normalizeOptionalText(dto.description),
      displayOrder: dto.displayOrder ?? 0,
      isActive: dto.isActive ?? true,
    });
    const saved = await this.moduleEntryRepository.save(moduleEntry);
    return this.findOne(saved.id);
  }

  async findAll(
    paginationDto: PaginationDto,
    filters?: Partial<FilterModuleEntryDto>,
  ): Promise<PaginatedResponseDto<ModuleEntry>> {
    const { page = 1, limit = 20 } = paginationDto;
    const skip = (page - 1) * limit;

    const queryBuilder = this.moduleEntryRepository
      .createQueryBuilder('module_entry')
      .where('module_entry.deleted_at IS NULL')
      .skip(skip)
      .take(limit)
      .orderBy('module_entry.displayOrder', 'ASC')
      .addOrderBy('module_entry.created_at', 'DESC');

    if (filters?.moduleName) {
      queryBuilder.andWhere('module_entry.moduleName ILIKE :moduleName', {
        moduleName: `%${filters.moduleName.trim()}%`,
      });
    }

    if (filters?.moduleKey) {
      queryBuilder.andWhere('module_entry.moduleKey ILIKE :moduleKey', {
        moduleKey: `%${filters.moduleKey.trim()}%`,
      });
    }

    if (filters?.isActive !== undefined) {
      queryBuilder.andWhere('module_entry.isActive = :isActive', {
        isActive: filters.isActive,
      });
    }

    const [items, total] = await queryBuilder.getManyAndCount();
    const totalPages = Math.max(Math.ceil(total / limit), 1);

    return {
      items,
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

  async findOne(id: string) {
    const moduleEntry = await this.moduleEntryRepository
      .createQueryBuilder('module_entry')
      .where('module_entry.id = :id', { id })
      .andWhere('module_entry.deleted_at IS NULL')
      .getOne();

    if (!moduleEntry) {
      throw new NotFoundException('Module entry not found');
    }

    return moduleEntry;
  }

  async update(id: string, dto: UpdateModuleEntryDto) {
    const existing = await this.findOne(id);
    const nextModuleKey = dto.moduleKey ? this.normalizeKey(dto.moduleKey) : existing.moduleKey;

    await this.ensureModuleKeyIsUnique(nextModuleKey, id);

    await this.moduleEntryRepository.update(id, {
      moduleName: dto.moduleName?.trim() ?? existing.moduleName,
      moduleKey: nextModuleKey,
      description:
        dto.description === undefined ? existing.description : this.normalizeOptionalText(dto.description),
      displayOrder: dto.displayOrder ?? existing.displayOrder,
      isActive: dto.isActive ?? existing.isActive,
      updated_by_id: dto.updated_by_id,
    });

    return this.findOne(id);
  }

  remove(id: string, deletedById: string) {
    return this.moduleEntryRepository.update(id, {
      deleted_at: new Date(),
      deleted_by_id: deletedById,
    });
  }

  private async ensureModuleKeyIsUnique(moduleKey: string, ignoreId?: string) {
    const normalizedKey = this.normalizeKey(moduleKey);
    const queryBuilder = this.moduleEntryRepository
      .createQueryBuilder('module_entry')
      .where('LOWER(TRIM(module_entry.moduleKey)) = :moduleKey', { moduleKey: normalizedKey })
      .andWhere('module_entry.deleted_at IS NULL');

    if (ignoreId) {
      queryBuilder.andWhere('module_entry.id != :ignoreId', { ignoreId });
    }

    const existingModuleEntry = await queryBuilder.getOne();

    if (existingModuleEntry) {
      throw new BadRequestException('Module key already exists');
    }
  }

  private normalizeKey(value: string) {
    return value.trim().toLowerCase().replace(/\s+/g, '-');
  }

  private normalizeOptionalText(value?: string | null) {
    if (value === undefined || value === null) {
      return null;
    }

    const normalized = value.trim();
    return normalized.length ? normalized : null;
  }
}
