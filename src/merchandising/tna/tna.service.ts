import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, In, Repository } from 'typeorm';
import { Buyer } from 'src/merchandising/buyer/entity/buyer.entity';
import { Job } from 'src/merchandising/job/entity/job.entity';
import { TnaTask } from 'src/merchandising/master-data/tna-task/entity/tna-task.entity';
import { PaginatedResponseDto } from 'src/common/dto/paginated-response.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { CreateTnaDto } from './dto/create-tna.dto';
import { CreateTnaDetailDto } from './dto/create-tna-detail.dto';
import { FilterTnaDto } from './dto/filter-tna.dto';
import { UpdateTnaDto } from './dto/update-tna.dto';
import { TnaDetailRevision } from './entity/tna-detail-revision.entity';
import { TnaDetail } from './entity/tna-details.entity';
import { Tna } from './entity/tna.entity';

type TnaListFilters = Partial<FilterTnaDto> & {
  deletedOnly?: string | boolean;
};

@Injectable()
export class TnaService {
  constructor(
    private dataSource: DataSource,
    @InjectRepository(Tna)
    private tnaRepository: Repository<Tna>,
    @InjectRepository(Buyer)
    private buyerRepository: Repository<Buyer>,
    @InjectRepository(Job)
    private jobRepository: Repository<Job>,
    @InjectRepository(TnaTask)
    private tnaTaskRepository: Repository<TnaTask>,
    @InjectRepository(TnaDetailRevision)
    private tnaDetailRevisionRepository: Repository<TnaDetailRevision>,
  ) {}

  async create(dto: CreateTnaDto, userId: string, organizationId: string) {
    await this.findBuyerOrFail(dto.buyerId, organizationId);
    await this.findJobOrFail(dto.jobId, organizationId);
    await this.validateDetails(dto.tnaDetails ?? []);

    const tnaId = await this.dataSource.transaction(async (manager) => {
      const tnaRepository = manager.getRepository(Tna);
      const tna = tnaRepository.create({
        buyerId: dto.buyerId,
        jobId: dto.jobId,
        leadTime: this.numberOrDefault(dto.leadTime, 0),
        created_by_id: userId,
        updated_by_id: null as unknown as string,
        updated_at: null as unknown as Date,
      });

      const savedTna = await tnaRepository.save(tna);
      await this.syncDetails(savedTna.id, dto.tnaDetails ?? [], userId, manager);
      return savedTna.id;
    });

    return this.findOne(tnaId, organizationId);
  }

  async findAll(
    paginationDto: PaginationDto,
    filters?: TnaListFilters,
    organizationId?: string,
  ): Promise<PaginatedResponseDto<Tna>> {
    const { page = 1, limit = 1000000000000 } = paginationDto;
    const skip = (page - 1) * limit;
    const deletedOnly = filters?.deletedOnly === true || filters?.deletedOnly === 'true';

    const queryBuilder = this.tnaRepository
      .createQueryBuilder('tna')
      .distinct(true)
      .leftJoinAndSelect('tna.buyer', 'buyer')
      .leftJoinAndSelect('tna.job', 'job')
      .leftJoinAndSelect('job.factory', 'factory')
      .leftJoinAndSelect('tna.tnaDetails', 'tnaDetails')
      .leftJoinAndSelect('tnaDetails.task', 'task')
      .leftJoinAndSelect('tna.created_by_user', 'created_by_user')
      .leftJoinAndSelect('tna.updated_by_user', 'updated_by_user')
      .leftJoinAndSelect('tna.deleted_by_user', 'deleted_by_user')
      .where('factory.organization_id = :organizationId', { organizationId })
      .skip(skip)
      .take(limit)
      .orderBy(deletedOnly ? 'tna.deleted_at' : 'tna.created_at', 'DESC')
      .addOrderBy('tnaDetails.sortOrder', 'ASC');

    if (deletedOnly) {
      queryBuilder.withDeleted().andWhere('tna.deleted_at IS NOT NULL');
    } else {
      queryBuilder.andWhere('tna.deleted_at IS NULL');
    }

    if (filters?.buyerId) {
      queryBuilder.andWhere('tna.buyer_id = :buyerId', { buyerId: filters.buyerId });
    }

    if (filters?.jobId) {
      queryBuilder.andWhere('tna.job_id = :jobId', { jobId: filters.jobId });
    }

    const [items, total] = await queryBuilder.getManyAndCount();
    items.forEach((item) => this.sortDetailsBySortOrder(item));
    const totalPages = Math.ceil(total / limit);

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

  async findOne(id: string, organizationId: string) {
    const tna = await this.tnaRepository
      .createQueryBuilder('tna')
      .leftJoinAndSelect('tna.buyer', 'buyer')
      .leftJoinAndSelect('tna.job', 'job')
      .leftJoinAndSelect('job.factory', 'factory')
      .leftJoinAndSelect('tna.tnaDetails', 'tnaDetails')
      .leftJoinAndSelect('tnaDetails.task', 'task')
      .leftJoinAndSelect('tna.created_by_user', 'created_by_user')
      .leftJoinAndSelect('tna.updated_by_user', 'updated_by_user')
      .leftJoinAndSelect('tna.deleted_by_user', 'deleted_by_user')
      .where('tna.id = :id', { id })
      .andWhere('factory.organization_id = :organizationId', { organizationId })
      .andWhere('tna.deleted_at IS NULL')
      .orderBy('tnaDetails.sortOrder', 'ASC')
      .getOne();

    if (!tna) {
      throw new NotFoundException('TNA record not found in the selected organization.');
    }

    return this.sortDetailsBySortOrder(tna);
  }

  async update(id: string, dto: UpdateTnaDto, userId: string, organizationId: string) {
    if (dto.buyerId !== undefined) {
      await this.findBuyerOrFail(dto.buyerId, organizationId);
    }

    if (dto.jobId !== undefined) {
      await this.findJobOrFail(dto.jobId, organizationId);
    }

    if (dto.tnaDetails !== undefined) {
      await this.validateDetails(dto.tnaDetails);
    }

    await this.dataSource.transaction(async (manager) => {
      const tna = await manager
        .getRepository(Tna)
        .createQueryBuilder('tna')
        .leftJoinAndSelect('tna.job', 'job')
        .leftJoinAndSelect('job.factory', 'factory')
        .where('tna.id = :id', { id })
        .andWhere('factory.organization_id = :organizationId', { organizationId })
        .andWhere('tna.deleted_at IS NULL')
        .getOne();

      if (!tna) {
        throw new NotFoundException('TNA record not found in the selected organization.');
      }

      if (dto.buyerId !== undefined) {
        tna.buyerId = dto.buyerId;
      }

      if (dto.jobId !== undefined) {
        tna.jobId = dto.jobId;
      }

      if (dto.leadTime !== undefined) {
        tna.leadTime = this.numberOrDefault(dto.leadTime, tna.leadTime);
      }

      tna.updated_by_id = userId;

      await manager.getRepository(Tna).save(tna);

      if (dto.tnaDetails !== undefined) {
        await this.syncDetails(tna.id, dto.tnaDetails, userId, manager);
      }
    });

    return this.findOne(id, organizationId);
  }

  async remove(id: string, deletedById: string, organizationId: string) {
    await this.ensureTnaExists(id, organizationId);
    await this.tnaRepository.update({ id }, { deleted_by_id: deletedById });
    return this.tnaRepository.softDelete({ id });
  }

  async findDetailRevisions(tnaId: string, detailId: string, organizationId: string) {
    const detail = await this.dataSource
      .getRepository(TnaDetail)
      .createQueryBuilder('detail')
      .innerJoin('detail.tna', 'tna')
      .innerJoin('tna.job', 'job')
      .innerJoin('job.factory', 'factory')
      .where('detail.id = :detailId', { detailId })
      .andWhere('detail.tna_id = :tnaId', { tnaId })
      .andWhere('factory.organization_id = :organizationId', { organizationId })
      .andWhere('tna.deleted_at IS NULL')
      .getOne();

    if (!detail) {
      throw new NotFoundException('TNA detail not found in the selected organization.');
    }

    return this.tnaDetailRevisionRepository
      .createQueryBuilder('revision')
      .leftJoinAndSelect('revision.created_by_user', 'created_by_user')
      .leftJoinAndSelect('revision.updated_by_user', 'updated_by_user')
      .where('revision.tna_detail_id = :detailId', { detailId })
      .orderBy('revision.created_at', 'DESC')
      .addOrderBy('revision.id', 'DESC')
      .getMany();
  }

  async permanentRemove(id: string, organizationId: string) {
    await this.ensureTnaExists(id, organizationId, true);
    return this.tnaRepository.delete({ id });
  }

  async restore(id: string, organizationId: string) {
    await this.ensureTnaExists(id, organizationId, true);
    return this.tnaRepository.restore({ id });
  }

  private async syncDetails(tnaId: string, details: CreateTnaDetailDto[], userId: string, manager: EntityManager = this.dataSource.manager) {
    const tnaDetailRepository = manager.getRepository(TnaDetail);
    const tnaDetailRevisionRepository = manager.getRepository(TnaDetailRevision);
    const existingDetails = await tnaDetailRepository.find({ where: { tnaId } });
    const existingById = new Map(existingDetails.map((detail) => [detail.id, detail]));
    const incomingExistingIds = new Set(
      details
        .map((detail) => detail.id)
        .filter((detailId): detailId is string => Boolean(detailId && existingById.has(detailId))),
    );
    const removedDetailIds = existingDetails
      .filter((detail) => !incomingExistingIds.has(detail.id))
      .map((detail) => detail.id);

    if (removedDetailIds.length) {
      await tnaDetailRepository.delete({ id: In(removedDetailIds) });
    }

    if (!details.length) {
      return;
    }

    for (const [index, detail] of details.entries()) {
      const existingDetail = detail.id ? existingById.get(detail.id) : undefined;
      const entity = existingDetail ?? tnaDetailRepository.create({ tnaId, created_by_id: userId });
      const stagedRevisions = detail.revisions ?? [];
      const latestRevision = stagedRevisions[stagedRevisions.length - 1];

      entity.tnaId = tnaId;
      entity.taskId = detail.taskId;
      entity.executionDate = this.parseRequiredDate(latestRevision?.newExecutionDate ?? detail.executionDate);
      entity.days = this.numberOrDefault(detail.days, 0);
      entity.sortOrder = this.numberOrDefault(detail.sortOrder, index + 1);
      entity.relationFormula = this.normalizeString(detail.relationFormula);

      if (existingDetail) {
        entity.updated_by_id = userId;
      } else {
        entity.updated_by_id = null as unknown as string;
        entity.updated_at = null as unknown as Date;
      }

      const savedDetail = await tnaDetailRepository.save(entity);
      const revisionEntities = stagedRevisions.map((revision) =>
        tnaDetailRevisionRepository.create({
          tnaDetailId: savedDetail.id,
          previousExecutionDate: this.parseRequiredDate(revision.previousExecutionDate),
          newExecutionDate: this.parseRequiredDate(revision.newExecutionDate),
          note: this.normalizeString(revision.note),
          created_by_id: userId,
          updated_by_id: null as unknown as string,
          updated_at: null as unknown as Date,
        }),
      );

      if (revisionEntities.length) {
        await tnaDetailRevisionRepository.save(revisionEntities);
      }
    }
  }

  private async validateDetails(details: CreateTnaDetailDto[]) {
    for (const detail of details) {
      await this.findTnaTaskOrFail(detail.taskId);
    }
  }

  private sortDetailsBySortOrder(tna: Tna) {
    tna.tnaDetails = [...(tna.tnaDetails ?? [])].sort((left, right) => {
      const sortDifference = this.numberOrDefault(left.sortOrder, 0) - this.numberOrDefault(right.sortOrder, 0);

      if (sortDifference !== 0) {
        return sortDifference;
      }

      return left.id.localeCompare(right.id);
    });

    return tna;
  }

  private async findBuyerOrFail(buyerId: string, organizationId: string) {
    const buyer = await this.buyerRepository.findOne({
      where: { id: buyerId, organizationId },
    });

    if (!buyer) {
      throw new BadRequestException('Buyer not found in the selected organization.');
    }

    return buyer;
  }

  private async findJobOrFail(jobId: string, organizationId: string) {
    const job = await this.jobRepository
      .createQueryBuilder('job')
      .innerJoin('job.factory', 'factory')
      .where('job.id = :jobId', { jobId })
      .andWhere('factory.organization_id = :organizationId', { organizationId })
      .andWhere('job.deleted_at IS NULL')
      .getOne();

    if (!job) {
      throw new BadRequestException('Job not found in the selected organization.');
    }

    return job;
  }

  private async findTnaTaskOrFail(taskId: string) {
    const queryBuilder = this.tnaTaskRepository
      .createQueryBuilder('tnaTask')
      .where('tnaTask.id = :taskId', { taskId })
      .andWhere('tnaTask.deleted_at IS NULL');

    const task = await queryBuilder.getOne();

    if (!task) {
      throw new BadRequestException('TNA task not found.');
    }

    return task;
  }

  private async ensureTnaExists(id: string, organizationId: string, includeDeleted = false) {
    const queryBuilder = this.tnaRepository
      .createQueryBuilder('tna')
      .leftJoin('tna.job', 'job')
      .leftJoin('job.factory', 'factory')
      .where('tna.id = :id', { id })
      .andWhere('factory.organization_id = :organizationId', { organizationId });

    if (includeDeleted) {
      queryBuilder.withDeleted();
    } else {
      queryBuilder.andWhere('tna.deleted_at IS NULL');
    }

    const tna = await queryBuilder.getOne();

    if (!tna) {
      throw new NotFoundException('TNA record not found in the selected organization.');
    }

    return tna;
  }

  private parseRequiredDate(value: string | Date) {
    if (value instanceof Date) {
      if (Number.isNaN(value.getTime())) {
        throw new BadRequestException('Execution date must be a valid date.');
      }

      return value;
    }

    const trimmed = value.trim();
    const parsed = new Date(trimmed);

    if (Number.isNaN(parsed.getTime())) {
      throw new BadRequestException('Execution date must be a valid date.');
    }

    return parsed;
  }

  private numberOrDefault(value: number | string | null | undefined, fallback: number) {
    const numberValue = Number(value);
    return Number.isFinite(numberValue) ? numberValue : fallback;
  }

  private normalizeString(value: string | null | undefined) {
    const trimmed = value?.trim() ?? '';
    return trimmed || null;
  }
}
