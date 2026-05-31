import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { PaginatedResponseDto } from 'src/common/dto/paginated-response.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { FabricProcess, FabricProcessStage, FabricProcessType } from './entity/fabric-process.entity';
import { CreateFabricProcessDto } from './dto/create-fabric-process.dto';
import { FilterFabricProcessDto } from './dto/filter-fabric-process.dto';
import { UpdateFabricProcessDto } from './dto/update-fabric-process.dto';

@Injectable()
export class FabricProcessService {
  constructor(
    @InjectRepository(FabricProcess)
    private fabricProcessRepository: Repository<FabricProcess>,
  ) { }

  async create(fabricProcessDto: CreateFabricProcessDto, organizationId: string) {
    await this.ensureNameIsUnique(fabricProcessDto.name, organizationId);
    const parent = await this.validateHierarchy(fabricProcessDto, organizationId);
    const fabricProcess = this.fabricProcessRepository.create({
      ...fabricProcessDto,
      processType: fabricProcessDto.processType ?? FabricProcessType.STEP,
      stage: parent?.stage ?? fabricProcessDto.stage ?? FabricProcessStage.GREY_TO_FINISHED,
      parentProcessId: fabricProcessDto.parentProcessId ?? null,
      sortOrder: fabricProcessDto.sortOrder ?? 0,
      organizationId,
    });
    const saved = await this.fabricProcessRepository.save(fabricProcess);
    return this.normalizeUpdatedAt(await this.findOne(saved.id, organizationId));
  }

  async findAll(
    paginationDto: PaginationDto,
    filters?: Partial<FilterFabricProcessDto>,
    organizationId?: string,
  ): Promise<PaginatedResponseDto<FabricProcess>> {
    const { page = 1, limit = 1000000000000 } = paginationDto;
    const deletedOnly = filters?.deletedOnly ?? false;
    const skip = (page - 1) * limit;

    const queryBuilder = this.fabricProcessRepository
      .createQueryBuilder('fabricProcess')
      .leftJoinAndSelect('fabricProcess.created_by_user', 'created_by_user')
      .leftJoinAndSelect('fabricProcess.updated_by_user', 'updated_by_user')
      .leftJoinAndSelect('fabricProcess.deleted_by_user', 'deleted_by_user')
      .leftJoinAndSelect('fabricProcess.parentProcess', 'parentProcess')
      .where('fabricProcess.organization_id = :organizationId', { organizationId })
      .skip(skip)
      .take(limit)
      .orderBy('fabricProcess.sortOrder', 'ASC')
      .addOrderBy(deletedOnly ? 'fabricProcess.deleted_at' : 'fabricProcess.created_at', 'DESC');

    if (deletedOnly) {
      queryBuilder.withDeleted();
    }

    if (filters?.name) {
      queryBuilder.andWhere('LOWER(TRIM(fabricProcess.name)) LIKE :name', {
        name: `%${filters.name.trim().toLowerCase()}%`,
      });
    }

    if (filters?.isActive !== undefined && filters.isActive !== '') {
      queryBuilder.andWhere('fabricProcess.isActive = :isActive', {
        isActive: filters.isActive === 'true',
      });
    }

    if (deletedOnly) {
      queryBuilder.andWhere('fabricProcess.deleted_at IS NOT NULL');
    } else {
      queryBuilder.andWhere('fabricProcess.deleted_at IS NULL');
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
    return this.fabricProcessRepository
      .createQueryBuilder('fabricProcess')
      .leftJoinAndSelect('fabricProcess.created_by_user', 'created_by_user')
      .leftJoinAndSelect('fabricProcess.updated_by_user', 'updated_by_user')
      .leftJoinAndSelect('fabricProcess.deleted_by_user', 'deleted_by_user')
      .leftJoinAndSelect('fabricProcess.parentProcess', 'parentProcess')
      .where('fabricProcess.organization_id = :organizationId', { organizationId })
      .andWhere('fabricProcess.id = :id', { id })
      .andWhere('fabricProcess.deleted_at IS NULL')
      .getOne()
      .then((fabricProcess) => {
        if (!fabricProcess) {
          throw new NotFoundException('Fabric process not found in the selected organization.');
        }

        return this.normalizeUpdatedAt(fabricProcess);
      });
  }

  async update(id: number, dto: UpdateFabricProcessDto, organizationId: string) {
    const existing = await this.ensureFabricProcessExists(id, organizationId);
    await this.ensureNameIsUnique(dto.name, organizationId, id);
    const parent = await this.validateHierarchy(dto, organizationId, id, existing);
    const stage = parent?.stage ?? dto.stage ?? existing.stage;
    await this.fabricProcessRepository.update(
      { id, organizationId },
      {
        ...dto,
        stage,
        ...(dto.parentProcessId !== undefined ? { parentProcessId: dto.parentProcessId ?? null } : {}),
      },
    );
    if ((dto.processType ?? existing.processType) === FabricProcessType.GROUP && stage !== existing.stage) {
      await this.fabricProcessRepository.update({ parentProcessId: id, organizationId }, { stage });
    }
    return this.normalizeUpdatedAt(await this.findOne(id, organizationId));
  }

  async remove(id: number, deletedById: string, organizationId: string) {
    await this.ensureFabricProcessExists(id, organizationId);
    await this.ensureGroupHasNoChildren(id, organizationId);
    await this.fabricProcessRepository.update({ id, organizationId }, { deleted_by_id: deletedById });
    return this.fabricProcessRepository.softDelete({ id, organizationId });
  }

  async permanentRemove(id: number, organizationId: string) {
    await this.ensureFabricProcessExists(id, organizationId, true);
    await this.ensureGroupHasNoChildren(id, organizationId, true);
    return this.fabricProcessRepository.delete({ id, organizationId });
  }

  async restore(id: number, organizationId: string) {
    await this.ensureFabricProcessExists(id, organizationId, true);
    return this.fabricProcessRepository.restore({ id, organizationId });
  }

  private async ensureNameIsUnique(name: string, organizationId: string, ignoreId?: number) {
    const normalizedName = name.trim().toLowerCase();

    const queryBuilder = this.fabricProcessRepository
      .createQueryBuilder('fabricProcess')
      .where('LOWER(TRIM(fabricProcess.name)) = :name', {
        name: normalizedName,
      })
      .andWhere('fabricProcess.organization_id = :organizationId', { organizationId })
      .andWhere('fabricProcess.deleted_at IS NULL');

    if (ignoreId !== undefined) {
      queryBuilder.andWhere('fabricProcess.id != :ignoreId', { ignoreId });
    }

    const existingFabricProcess = await queryBuilder.getOne();

    if (existingFabricProcess) {
      throw new BadRequestException('Fabric process already exists');
    }
  }

  private async ensureFabricProcessExists(id: number, organizationId: string, includeDeleted = false) {
    const queryBuilder = this.fabricProcessRepository
      .createQueryBuilder('fabricProcess')
      .where('fabricProcess.id = :id', { id })
      .andWhere('fabricProcess.organization_id = :organizationId', { organizationId });

    if (includeDeleted) {
      queryBuilder.withDeleted();
    } else {
      queryBuilder.andWhere('fabricProcess.deleted_at IS NULL');
    }

    const fabricProcess = await queryBuilder.getOne();

    if (!fabricProcess) {
      throw new NotFoundException('Fabric process not found in the selected organization.');
    }

    return fabricProcess;
  }

  private async validateHierarchy(dto: CreateFabricProcessDto, organizationId: string, currentId?: number, existing?: FabricProcess) {
    const processType = dto.processType ?? existing?.processType ?? FabricProcessType.STEP;
    const parentProcessId = dto.parentProcessId !== undefined ? dto.parentProcessId : existing?.parentProcessId ?? null;

    if (processType === FabricProcessType.GROUP && parentProcessId !== null) {
      throw new BadRequestException('A process group cannot be assigned to another parent process.');
    }

    if (currentId !== undefined && parentProcessId === currentId) {
      throw new BadRequestException('A fabric process cannot be its own parent.');
    }

    if (currentId !== undefined && processType === FabricProcessType.STEP) {
      const childCount = await this.fabricProcessRepository.count({ where: { parentProcessId: currentId, organizationId } });
      if (childCount > 0) {
        throw new BadRequestException('A process group with child processes cannot be changed to a step.');
      }
    }

    if (parentProcessId === null) return null;

    const parent = await this.fabricProcessRepository.findOne({ where: { id: parentProcessId, organizationId } });
    if (!parent) throw new BadRequestException('Parent fabric process not found in the selected organization.');
    if (parent.processType !== FabricProcessType.GROUP) {
      throw new BadRequestException('Only a process group can be selected as the parent process.');
    }

    return parent;
  }

  private async ensureGroupHasNoChildren(id: number, organizationId: string, withDeleted = false) {
    const queryBuilder = this.fabricProcessRepository
      .createQueryBuilder('fabricProcess')
      .where('fabricProcess.parent_process_id = :id', { id })
      .andWhere('fabricProcess.organization_id = :organizationId', { organizationId });

    if (withDeleted) queryBuilder.withDeleted();
    else queryBuilder.andWhere('fabricProcess.deleted_at IS NULL');

    if ((await queryBuilder.getCount()) > 0) {
      throw new BadRequestException('Delete or reassign this group child processes first.');
    }
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
}
