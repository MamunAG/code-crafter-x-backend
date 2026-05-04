import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Factory } from 'src/app-configuration/factory/entity/factory.entity';
import { PaginatedResponseDto } from 'src/common/dto/paginated-response.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { Buyer } from 'src/merchandising/buyer/entity/buyer.entity';
import { Color } from 'src/merchandising/master-data/color/entity/color.entity';
import { Size } from 'src/merchandising/master-data/size/entity/size.entity';
import { Style } from 'src/merchandising/style/entity/style.entity';
import { Repository } from 'typeorm';
import { CreateJobDetailDto } from './dto/create-job-detail.dto';
import { CreateJobDto } from './dto/create-job.dto';
import { FilterJobDto } from './dto/filter-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { JobDetails } from './entity/job-details.entity';
import { Job } from './entity/job.entity';
import { PurchaseOrder } from './entity/purchase-order.entity';

type JobListFilters = Partial<FilterJobDto> & {
  deletedOnly?: string | boolean;
};

@Injectable()
export class JobService {
  constructor(
    @InjectRepository(Job)
    private jobRepository: Repository<Job>,

    @InjectRepository(JobDetails)
    private jobDetailsRepository: Repository<JobDetails>,

    @InjectRepository(PurchaseOrder)
    private purchaseOrderRepository: Repository<PurchaseOrder>,

    @InjectRepository(Factory)
    private factoryRepository: Repository<Factory>,

    @InjectRepository(Buyer)
    private buyerRepository: Repository<Buyer>,

    @InjectRepository(Style)
    private styleRepository: Repository<Style>,

    @InjectRepository(Size)
    private sizeRepository: Repository<Size>,

    @InjectRepository(Color)
    private colorRepository: Repository<Color>,
  ) {}

  async create(dto: CreateJobDto, userId: string, organizationId: string) {
    await this.findFactoryOrFail(dto.factoryId, organizationId);
    await this.findBuyerOrFail(dto.buyerId, organizationId);

    const details = dto.jobDetails ?? [];
    await this.validateDetails(details, organizationId);

    const job = this.jobRepository.create({
      factoryId: dto.factoryId,
      buyerId: dto.buyerId,
      merchandiserId: this.nullableNumber(dto.merchandiserId) ?? 0,
      ordertype: dto.ordertype ?? undefined,
      totalPoQty: details.length ? this.sumDetailQuantity(details) : this.numberOrDefault(dto.totalPoQty, 0),
      poReceiveDate: this.parseOptionalDate(dto.poReceiveDate) ?? undefined,
      isActive: dto.isActive === undefined ? true : dto.isActive,
      created_by_id: userId,
      updated_by_id: null as unknown as string,
      updated_at: null as unknown as Date,
    });

    const savedJob = await this.jobRepository.save(job);
    await this.syncJobDetails(savedJob.id, details, userId);

    return this.findOne(savedJob.id, organizationId);
  }

  async findAll(
    paginationDto: PaginationDto,
    filters?: JobListFilters,
    organizationId?: string,
  ): Promise<PaginatedResponseDto<Job>> {
    const { page = 1, limit = 1000000000000 } = paginationDto;
    const skip = (page - 1) * limit;
    const deletedOnly = filters?.deletedOnly === true || filters?.deletedOnly === 'true';

    const queryBuilder = this.jobRepository
      .createQueryBuilder('job')
      .distinct(true)
      .leftJoinAndSelect('job.factory', 'factory')
      .leftJoinAndSelect('job.buyer', 'buyer')
      .leftJoinAndSelect('job.jobDetails', 'jobDetails')
      .leftJoinAndSelect('jobDetails.purchaseOrder', 'purchaseOrder')
      .leftJoinAndSelect('jobDetails.style', 'style')
      .leftJoinAndSelect('jobDetails.size', 'size')
      .leftJoinAndSelect('jobDetails.color', 'color')
      .leftJoinAndSelect('job.created_by_user', 'created_by_user')
      .leftJoinAndSelect('job.updated_by_user', 'updated_by_user')
      .leftJoinAndSelect('job.deleted_by_user', 'deleted_by_user')
      .where('factory.organization_id = :organizationId', { organizationId })
      .skip(skip)
      .take(limit)
      .orderBy(deletedOnly ? 'job.deleted_at' : 'job.created_at', 'DESC');

    if (deletedOnly) {
      queryBuilder.withDeleted().andWhere('job.deleted_at IS NOT NULL');
    } else {
      queryBuilder.andWhere('job.deleted_at IS NULL');
    }

    if (filters?.factoryId) {
      queryBuilder.andWhere('job.factory_id = :factoryId', { factoryId: filters.factoryId });
    }

    if (filters?.buyerId) {
      queryBuilder.andWhere('job.buyer_id = :buyerId', { buyerId: filters.buyerId });
    }

    if (filters?.merchandiserId !== undefined) {
      queryBuilder.andWhere('job.merchandiser_id = :merchandiserId', {
        merchandiserId: filters.merchandiserId,
      });
    }

    if (filters?.ordertype) {
      queryBuilder.andWhere('job.ordertype = :ordertype', { ordertype: filters.ordertype });
    }

    if (filters?.pono) {
      queryBuilder.andWhere('purchaseOrder.pono ILIKE :pono', { pono: `%${filters.pono}%` });
    }

    if (filters?.isActive !== undefined && filters.isActive !== '') {
      queryBuilder.andWhere('job.is_active = :isActive', {
        isActive: this.parseBoolean(filters.isActive),
      });
    }

    const [items, total] = await queryBuilder.getManyAndCount();
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
    const job = await this.jobRepository
      .createQueryBuilder('job')
      .leftJoinAndSelect('job.factory', 'factory')
      .leftJoinAndSelect('job.buyer', 'buyer')
      .leftJoinAndSelect('job.jobDetails', 'jobDetails')
      .leftJoinAndSelect('jobDetails.purchaseOrder', 'purchaseOrder')
      .leftJoinAndSelect('jobDetails.style', 'style')
      .leftJoinAndSelect('jobDetails.size', 'size')
      .leftJoinAndSelect('jobDetails.color', 'color')
      .leftJoinAndSelect('job.created_by_user', 'created_by_user')
      .leftJoinAndSelect('job.updated_by_user', 'updated_by_user')
      .leftJoinAndSelect('job.deleted_by_user', 'deleted_by_user')
      .where('job.id = :id', { id })
      .andWhere('factory.organization_id = :organizationId', { organizationId })
      .andWhere('job.deleted_at IS NULL')
      .getOne();

    if (!job) {
      throw new NotFoundException('Job not found in the selected organization.');
    }

    return job;
  }

  async update(id: string, dto: UpdateJobDto, userId: string, organizationId: string) {
    const job = await this.jobRepository
      .createQueryBuilder('job')
      .leftJoinAndSelect('job.factory', 'factory')
      .where('job.id = :id', { id })
      .andWhere('factory.organization_id = :organizationId', { organizationId })
      .andWhere('job.deleted_at IS NULL')
      .getOne();

    if (!job) {
      throw new NotFoundException('Job not found in the selected organization.');
    }

    if (dto.factoryId !== undefined) {
      await this.findFactoryOrFail(dto.factoryId, organizationId);
      job.factoryId = dto.factoryId;
    }

    if (dto.buyerId !== undefined) {
      await this.findBuyerOrFail(dto.buyerId, organizationId);
      job.buyerId = dto.buyerId;
    }

    if (dto.merchandiserId !== undefined) {
      job.merchandiserId = this.nullableNumber(dto.merchandiserId) ?? 0;
    }

    if (dto.ordertype !== undefined) {
      job.ordertype = dto.ordertype ?? undefined;
    }

    if (dto.poReceiveDate !== undefined) {
      job.poReceiveDate = this.parseOptionalDate(dto.poReceiveDate) ?? undefined;
    }

    if (dto.isActive !== undefined) {
      job.isActive = dto.isActive;
    }

    if (dto.jobDetails !== undefined) {
      await this.validateDetails(dto.jobDetails, organizationId);
      job.totalPoQty = this.sumDetailQuantity(dto.jobDetails);
    } else if (dto.totalPoQty !== undefined) {
      job.totalPoQty = this.numberOrDefault(dto.totalPoQty, 0);
    }

    job.updated_by_id = userId;
    job.updated_at = new Date();
    await this.jobRepository.save(job);

    if (dto.jobDetails !== undefined) {
      await this.syncJobDetails(id, dto.jobDetails, userId);
    }

    return this.findOne(id, organizationId);
  }

  async remove(id: string, deletedById: string, organizationId: string) {
    await this.ensureJobExists(id, organizationId);
    await this.jobRepository.update({ id }, { deleted_by_id: deletedById });
    return this.jobRepository.softDelete({ id });
  }

  async permanentRemove(id: string, organizationId: string) {
    await this.ensureJobExists(id, organizationId, true);
    return this.jobRepository.delete({ id });
  }

  async restore(id: string, organizationId: string) {
    await this.ensureJobExists(id, organizationId, true);
    return this.jobRepository.restore({ id });
  }

  private async syncJobDetails(jobId: string, details: CreateJobDetailDto[], userId: string) {
    await this.jobDetailsRepository.delete({ jobId });

    if (!details.length) {
      return;
    }

    const entities = await Promise.all(
      details.map(async (detail) => {
        const purchaseOrder = await this.findOrCreatePurchaseOrder(detail.pono, userId);

        return this.jobDetailsRepository.create({
          jobId,
          poId: purchaseOrder.id,
          styleId: detail.styleId,
          sizeId: detail.sizeId,
          colorId: detail.colorId,
          quantity: this.numberOrDefault(detail.quantity, 0),
          fob: this.numberOrDefault(detail.fob, 0),
          cm: this.numberOrDefault(detail.cm, 0),
          deliveryDate: this.parseOptionalDate(detail.deliveryDate) ?? undefined,
          remarks: this.nullableString(detail.remarks) ?? undefined,
          created_by_id: userId,
          updated_by_id: null as unknown as string,
          updated_at: null as unknown as Date,
        });
      }),
    );

    await this.jobDetailsRepository.save(entities);
  }

  private async findOrCreatePurchaseOrder(pono: string, userId: string) {
    const normalizedPono = pono.trim();

    if (!normalizedPono) {
      throw new BadRequestException('PO number is required for each job detail row.');
    }

    const existing = await this.purchaseOrderRepository
      .createQueryBuilder('purchaseOrder')
      .where('LOWER(TRIM(purchaseOrder.pono)) = :pono', { pono: normalizedPono.toLowerCase() })
      .getOne();

    if (existing) {
      return existing;
    }

    try {
      return await this.purchaseOrderRepository.save(
        this.purchaseOrderRepository.create({
          pono: normalizedPono,
          created_by_id: userId,
          updated_by_id: null as unknown as string,
          updated_at: null as unknown as Date,
        }),
      );
    } catch {
      const purchaseOrder = await this.purchaseOrderRepository
        .createQueryBuilder('purchaseOrder')
        .where('LOWER(TRIM(purchaseOrder.pono)) = :pono', { pono: normalizedPono.toLowerCase() })
        .getOne();

      if (!purchaseOrder) {
        throw new BadRequestException('Unable to save the purchase order number. Please try again.');
      }

      return purchaseOrder;
    }
  }

  private async validateDetails(details: CreateJobDetailDto[], organizationId: string) {
    for (const detail of details) {
      await Promise.all([
        this.findStyleOrFail(detail.styleId, organizationId),
        this.findSizeOrFail(detail.sizeId, organizationId),
        this.findColorOrFail(detail.colorId, organizationId),
      ]);
    }
  }

  private async ensureJobExists(id: string, organizationId: string, withDeleted = false) {
    const job = await this.jobRepository
      .createQueryBuilder('job')
      .withDeleted()
      .leftJoin('job.factory', 'factory')
      .where('job.id = :id', { id })
      .andWhere('factory.organization_id = :organizationId', { organizationId })
      .andWhere(withDeleted ? 'job.deleted_at IS NOT NULL' : 'job.deleted_at IS NULL')
      .getOne();

    if (!job) {
      throw new NotFoundException('Job not found in the selected organization.');
    }

    return job;
  }

  private async findFactoryOrFail(factoryId: string, organizationId: string) {
    const factory = await this.factoryRepository.findOne({
      where: { id: factoryId, organizationId },
    });

    if (!factory) {
      throw new BadRequestException('Factory not found in the selected organization.');
    }

    return factory;
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

  private async findStyleOrFail(styleId: string, organizationId: string) {
    const style = await this.styleRepository.findOne({
      where: { id: styleId, organizationId },
    });

    if (!style) {
      throw new BadRequestException('Style not found in the selected organization.');
    }

    return style;
  }

  private async findSizeOrFail(sizeId: number, organizationId: string) {
    const size = await this.sizeRepository.findOne({
      where: { id: sizeId, organizationId },
    });

    if (!size) {
      throw new BadRequestException('Size not found in the selected organization.');
    }

    return size;
  }

  private async findColorOrFail(colorId: number, organizationId: string) {
    const color = await this.colorRepository.findOne({
      where: { id: colorId, organizationId },
    });

    if (!color) {
      throw new BadRequestException('Color not found in the selected organization.');
    }

    return color;
  }

  private sumDetailQuantity(details: CreateJobDetailDto[]) {
    return details.reduce((total, detail) => total + this.numberOrDefault(detail.quantity, 0), 0);
  }

  private numberOrDefault(value: number | string | null | undefined, fallback: number) {
    const numberValue = Number(value);
    return Number.isFinite(numberValue) ? numberValue : fallback;
  }

  private nullableNumber(value: number | string | null | undefined) {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    const numberValue = Number(value);
    return Number.isFinite(numberValue) ? numberValue : null;
  }

  private nullableString(value: string | null | undefined) {
    const trimmedValue = value?.trim() ?? '';
    return trimmedValue || null;
  }

  private parseOptionalDate(value: string | Date | null | undefined) {
    if (value instanceof Date) {
      return Number.isNaN(value.getTime()) ? null : value;
    }

    const trimmedValue = value?.trim() ?? '';

    if (!trimmedValue) {
      return null;
    }

    const date = new Date(trimmedValue);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  private parseBoolean(value: boolean | string | null | undefined) {
    if (typeof value === 'boolean') {
      return value;
    }

    return ['true', 'yes', 'y', '1', 'active'].includes(value?.trim().toLowerCase() ?? '');
  }
}
