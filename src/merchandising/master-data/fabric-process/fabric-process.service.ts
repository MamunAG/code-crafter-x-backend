import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { PaginatedResponseDto } from 'src/common/dto/paginated-response.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { FabricProcess, FabricProcessStage } from './entity/fabric-process.entity';
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
    const fabricProcess = this.fabricProcessRepository.create({
      ...fabricProcessDto,
      stage: fabricProcessDto.stage ?? FabricProcessStage.GREY_TO_FINISHED,
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
    await this.ensureFabricProcessExists(id, organizationId);
    await this.ensureNameIsUnique(dto.name, organizationId, id);
    await this.fabricProcessRepository.update({ id, organizationId }, dto);
    return this.normalizeUpdatedAt(await this.findOne(id, organizationId));
  }

  async remove(id: number, deletedById: string, organizationId: string) {
    await this.ensureFabricProcessExists(id, organizationId);
    await this.fabricProcessRepository.update({ id, organizationId }, { deleted_by_id: deletedById });
    return this.fabricProcessRepository.softDelete({ id, organizationId });
  }

  async permanentRemove(id: number, organizationId: string) {
    await this.ensureFabricProcessExists(id, organizationId, true);
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
