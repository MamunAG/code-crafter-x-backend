import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { PaginatedResponseDto } from 'src/common/dto/paginated-response.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { CreateTnaTaskDto } from './dto/create-tna-task.dto';
import { FilterTnaTaskDto } from './dto/filter-tna-task.dto';
import { UpdateTnaTaskDto } from './dto/update-tna-task.dto';
import { TnaTask } from './entity/tna-task.entity';

type TnaTaskListFilters = Partial<FilterTnaTaskDto> & {
  deletedOnly?: string | boolean;
};

@Injectable()
export class TnaTaskService {
  constructor(
    @InjectRepository(TnaTask)
    private readonly tnaTaskRepository: Repository<TnaTask>,
  ) {}

  async create(dto: CreateTnaTaskDto, userId: string) {
    const payload = this.normalizePayload(dto);
    await this.ensureNameIsUnique(payload.name);

    const task = this.tnaTaskRepository.create({
      ...payload,
      created_by_id: userId,
    });

    const saved = await this.tnaTaskRepository.save(task);
    return this.normalizeUpdatedAt(await this.findOne(saved.id));
  }

  async findAll(
    paginationDto: PaginationDto,
    filters?: TnaTaskListFilters,
  ): Promise<PaginatedResponseDto<TnaTask>> {
    const { page = 1, limit = 1000000000000 } = paginationDto;
    const deletedOnly = filters?.deletedOnly === true || filters?.deletedOnly === 'true';
    const skip = (page - 1) * limit;

    const queryBuilder = this.tnaTaskRepository
      .createQueryBuilder('tna_task')
      .leftJoinAndSelect('tna_task.created_by_user', 'created_by_user')
      .leftJoinAndSelect('tna_task.updated_by_user', 'updated_by_user')
      .leftJoinAndSelect('tna_task.deleted_by_user', 'deleted_by_user')
      .addSelect('LOWER(tna_task.name)', 'tna_task_name_sort')
      .skip(skip)
      .take(limit)
      .orderBy('tna_task_name_sort', 'ASC')
      .addOrderBy(deletedOnly ? 'tna_task.deleted_at' : 'tna_task.created_at', 'DESC');

    if (deletedOnly) {
      queryBuilder.withDeleted();
    }

    if (filters?.name) {
      queryBuilder.andWhere('tna_task.name ILIKE :name', {
        name: `%${filters.name.trim()}%`,
      });
    }

    if (filters?.isActive !== undefined && filters?.isActive !== '') {
      queryBuilder.andWhere('tna_task.is_active = :isActive', {
        isActive: this.parseBoolean(filters.isActive),
      });
    }

    if (deletedOnly) {
      queryBuilder.andWhere('tna_task.deleted_at IS NOT NULL');
    } else {
      queryBuilder.andWhere('tna_task.deleted_at IS NULL');
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

  findOne(id: string) {
    return this.tnaTaskRepository
      .createQueryBuilder('tna_task')
      .leftJoinAndSelect('tna_task.created_by_user', 'created_by_user')
      .leftJoinAndSelect('tna_task.updated_by_user', 'updated_by_user')
      .leftJoinAndSelect('tna_task.deleted_by_user', 'deleted_by_user')
      .where('tna_task.id = :id', { id })
      .andWhere('tna_task.deleted_at IS NULL')
      .getOne()
      .then((task) => {
        if (!task) {
          throw new NotFoundException('TNA task not found.');
        }

        return this.normalizeUpdatedAt(task);
      });
  }

  async update(id: string, dto: UpdateTnaTaskDto, userId: string) {
    const payload = this.normalizePayload(dto);
    await this.ensureNameIsUnique(payload.name, id);

    const task = await this.tnaTaskRepository.findOne({
      where: { id },
      withDeleted: false,
    });

    if (!task) {
      throw new NotFoundException('TNA task not found.');
    }

    Object.assign(task, payload, {
      updated_by_id: userId,
      updated_at: new Date(),
    });

    await this.tnaTaskRepository.save(task);
    return this.normalizeUpdatedAt(await this.findOne(id));
  }

  async remove(id: string, deletedById: string) {
    await this.ensureTaskExists(id);
    await this.tnaTaskRepository.update({ id }, { deleted_by_id: deletedById });
    return this.tnaTaskRepository.softDelete({ id });
  }

  async permanentRemove(id: string) {
    await this.ensureTaskExists(id, true);
    return this.tnaTaskRepository.delete({ id });
  }

  async restore(id: string) {
    await this.ensureTaskExists(id, true);
    return this.tnaTaskRepository.restore({ id });
  }

  private normalizePayload(dto: Partial<CreateTnaTaskDto>): Partial<TnaTask> {
    const payload: Partial<TnaTask> = {};

    if (dto.name !== undefined) {
      payload.name = dto.name.trim();
    }

    if (dto.isActive !== undefined) {
      payload.isActive = dto.isActive;
    }

    return payload;
  }

  private async ensureNameIsUnique(name?: string, ignoreId?: string) {
    const normalizedName = name?.trim().toLowerCase();

    if (!normalizedName) {
      return;
    }

    const queryBuilder = this.tnaTaskRepository
      .createQueryBuilder('tna_task')
      .where('LOWER(TRIM(tna_task.name)) = :name', { name: normalizedName })
      .andWhere('tna_task.deleted_at IS NULL');

    if (ignoreId !== undefined) {
      queryBuilder.andWhere('tna_task.id != :ignoreId', { ignoreId });
    }

    const existing = await queryBuilder.getOne();

    if (existing) {
      throw new BadRequestException('TNA task already exists');
    }
  }

  private async ensureTaskExists(id: string, includeDeleted = false) {
    const queryBuilder = this.tnaTaskRepository
      .createQueryBuilder('tna_task')
      .where('tna_task.id = :id', { id });

    if (includeDeleted) {
      queryBuilder.withDeleted();
    } else {
      queryBuilder.andWhere('tna_task.deleted_at IS NULL');
    }

    const task = await queryBuilder.getOne();

    if (!task) {
      throw new NotFoundException('TNA task not found.');
    }

    return task;
  }

  private parseBoolean(value?: boolean | string | null) {
    if (value === true || value === false) {
      return value;
    }

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
