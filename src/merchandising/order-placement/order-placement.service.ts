import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Currency } from 'src/app-configuration/currency/entity/currency.entity';
import { Supplier } from 'src/app-configuration/supplier/entity/supplier.entity';
import { PaginatedResponseDto } from 'src/common/dto/paginated-response.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { Buyer } from 'src/merchandising/buyer/entity/buyer.entity';
import { JobDetails } from 'src/merchandising/job/entity/job-details.entity';
import { Job } from 'src/merchandising/job/entity/job.entity';
import { PurchaseOrder } from 'src/merchandising/job/entity/purchase-order.entity';
import { Color } from 'src/merchandising/master-data/color/entity/color.entity';
import { Size } from 'src/merchandising/master-data/size/entity/size.entity';
import { Style } from 'src/merchandising/style/entity/style.entity';
import { DataSource, EntityManager, In, Repository } from 'typeorm';
import { CreateOrderPlacementDetailDto } from './dto/create-order-placement-detail.dto';
import { CreateOrderPlacementDto } from './dto/create-order-placement.dto';
import { FilterOrderPlacementDto } from './dto/filter-order-placement.dto';
import { UpdateOrderPlacementDto } from './dto/update-order-placement.dto';
import { OrderPlacementDetails } from './entity/order-placement-details.entity';
import { OrderPlacement } from './entity/order-placement.entity';

type OrderPlacementListFilters = Partial<FilterOrderPlacementDto> & {
  deletedOnly?: string | boolean;
};

@Injectable()
export class OrderPlacementService {
  constructor(
    private dataSource: DataSource,

    @InjectRepository(OrderPlacement)
    private orderPlacementRepository: Repository<OrderPlacement>,

    @InjectRepository(OrderPlacementDetails)
    private orderPlacementDetailsRepository: Repository<OrderPlacementDetails>,

    @InjectRepository(Buyer)
    private buyerRepository: Repository<Buyer>,

    @InjectRepository(Job)
    private jobRepository: Repository<Job>,

    @InjectRepository(Currency)
    private currencyRepository: Repository<Currency>,

    @InjectRepository(Supplier)
    private supplierRepository: Repository<Supplier>,

    @InjectRepository(JobDetails)
    private jobDetailsRepository: Repository<JobDetails>,

    @InjectRepository(PurchaseOrder)
    private purchaseOrderRepository: Repository<PurchaseOrder>,

    @InjectRepository(Style)
    private styleRepository: Repository<Style>,

    @InjectRepository(Size)
    private sizeRepository: Repository<Size>,

    @InjectRepository(Color)
    private colorRepository: Repository<Color>,
  ) {}

  async create(dto: CreateOrderPlacementDto, userId: string, organizationId: string) {
    await this.findBuyerOrFail(dto.buyerId, organizationId);
    await this.findJobOrFail(dto.jobId, organizationId);
    await this.findCurrencyOrFail(dto.currencyId, organizationId);
    await this.findSupplierOrFail(dto.factoryId, organizationId);
    await this.validateDetails(dto.orderPlacementDetails ?? [], dto.jobId, organizationId);

    const orderPlacementId = await this.dataSource.transaction(async (manager) => {
      const repository = manager.getRepository(OrderPlacement);
      const orderPlacement = repository.create({
        buyerId: dto.buyerId,
        jobId: dto.jobId,
        currencyId: dto.currencyId,
        placementDate: this.parseRequiredDate(dto.placementDate, 'Placement date'),
        factoryId: dto.factoryId,
        isPlaced: dto.isPlaced ?? false,
        created_by_id: userId,
        updated_by_id: null as unknown as string,
        updated_at: null as unknown as Date,
      });

      const savedOrderPlacement = await repository.save(orderPlacement);
      await this.syncDetails(savedOrderPlacement.id, savedOrderPlacement.jobId, dto.orderPlacementDetails ?? [], userId, manager);
      return savedOrderPlacement.id;
    });

    return this.findOne(orderPlacementId, organizationId);
  }

  async findAll(
    paginationDto: PaginationDto,
    filters?: OrderPlacementListFilters,
    organizationId?: string,
  ): Promise<PaginatedResponseDto<OrderPlacement>> {
    const { page = 1, limit = 1000000000000 } = paginationDto;
    const skip = (page - 1) * limit;
    const deletedOnly = filters?.deletedOnly === true || filters?.deletedOnly === 'true';

    const queryBuilder = this.orderPlacementRepository
      .createQueryBuilder('orderPlacement')
      .distinct(true)
      .leftJoinAndSelect('orderPlacement.buyer', 'buyer')
      .leftJoinAndSelect('orderPlacement.job', 'job')
      .leftJoinAndSelect('orderPlacement.currency', 'currency')
      .leftJoinAndSelect('orderPlacement.factory', 'factory')
      .leftJoinAndSelect('orderPlacement.orderPlacementDetails', 'orderPlacementDetails')
      .leftJoinAndSelect('orderPlacementDetails.jobDetail', 'jobDetail')
      .leftJoinAndSelect('orderPlacementDetails.purchaseOrder', 'purchaseOrder')
      .leftJoinAndSelect('orderPlacementDetails.style', 'style')
      .leftJoinAndSelect('orderPlacementDetails.size', 'size')
      .leftJoinAndSelect('orderPlacementDetails.color', 'color')
      .leftJoinAndSelect('orderPlacement.created_by_user', 'created_by_user')
      .leftJoinAndSelect('orderPlacement.updated_by_user', 'updated_by_user')
      .leftJoinAndSelect('orderPlacement.deleted_by_user', 'deleted_by_user')
      .where('buyer.organization_id = :organizationId', { organizationId })
      .skip(skip)
      .take(limit)
      .orderBy(deletedOnly ? 'orderPlacement.deleted_at' : 'orderPlacement.created_at', 'DESC')
      .addOrderBy('orderPlacementDetails.created_at', 'ASC');

    if (deletedOnly) {
      queryBuilder.withDeleted().andWhere('orderPlacement.deleted_at IS NOT NULL');
    } else {
      queryBuilder.andWhere('orderPlacement.deleted_at IS NULL');
    }

    if (filters?.buyerId) {
      queryBuilder.andWhere('orderPlacement.buyer_id = :buyerId', { buyerId: filters.buyerId });
    }

    if (filters?.jobId) {
      queryBuilder.andWhere('orderPlacement.job_id = :jobId', { jobId: filters.jobId });
    }

    if (filters?.currencyId !== undefined) {
      queryBuilder.andWhere('orderPlacement.currency_id = :currencyId', { currencyId: filters.currencyId });
    }

    if (filters?.factoryId) {
      queryBuilder.andWhere('orderPlacement.factory_id = :factoryId', { factoryId: filters.factoryId });
    }

    if (filters?.placementDate) {
      queryBuilder.andWhere('orderPlacement.placement_date = :placementDate', { placementDate: filters.placementDate });
    }

    if (filters?.isPlaced !== undefined && filters.isPlaced !== '') {
      queryBuilder.andWhere('orderPlacement.is_placed = :isPlaced', {
        isPlaced: this.parseBoolean(filters.isPlaced),
      });
    }

    if (filters?.pono) {
      queryBuilder.andWhere('purchaseOrder.pono ILIKE :pono', { pono: `%${filters.pono}%` });
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
    const orderPlacement = await this.orderPlacementRepository
      .createQueryBuilder('orderPlacement')
      .leftJoinAndSelect('orderPlacement.buyer', 'buyer')
      .leftJoinAndSelect('orderPlacement.job', 'job')
      .leftJoinAndSelect('orderPlacement.currency', 'currency')
      .leftJoinAndSelect('orderPlacement.factory', 'factory')
      .leftJoinAndSelect('orderPlacement.orderPlacementDetails', 'orderPlacementDetails')
      .leftJoinAndSelect('orderPlacementDetails.jobDetail', 'jobDetail')
      .leftJoinAndSelect('orderPlacementDetails.purchaseOrder', 'purchaseOrder')
      .leftJoinAndSelect('orderPlacementDetails.style', 'style')
      .leftJoinAndSelect('orderPlacementDetails.size', 'size')
      .leftJoinAndSelect('orderPlacementDetails.color', 'color')
      .leftJoinAndSelect('orderPlacement.created_by_user', 'created_by_user')
      .leftJoinAndSelect('orderPlacement.updated_by_user', 'updated_by_user')
      .leftJoinAndSelect('orderPlacement.deleted_by_user', 'deleted_by_user')
      .where('orderPlacement.id = :id', { id })
      .andWhere('buyer.organization_id = :organizationId', { organizationId })
      .andWhere('orderPlacement.deleted_at IS NULL')
      .orderBy('orderPlacementDetails.created_at', 'ASC')
      .getOne();

    if (!orderPlacement) {
      throw new NotFoundException('Order placement not found in the selected organization.');
    }

    return orderPlacement;
  }

  async update(id: string, dto: UpdateOrderPlacementDto, userId: string, organizationId: string) {
    if (dto.buyerId !== undefined) {
      await this.findBuyerOrFail(dto.buyerId, organizationId);
    }

    if (dto.jobId !== undefined) {
      await this.findJobOrFail(dto.jobId, organizationId);
    }

    if (dto.currencyId !== undefined) {
      await this.findCurrencyOrFail(dto.currencyId, organizationId);
    }

    if (dto.factoryId !== undefined) {
      await this.findSupplierOrFail(dto.factoryId, organizationId);
    }

    await this.dataSource.transaction(async (manager) => {
      const orderPlacement = await manager
        .getRepository(OrderPlacement)
        .createQueryBuilder('orderPlacement')
        .leftJoinAndSelect('orderPlacement.buyer', 'buyer')
        .where('orderPlacement.id = :id', { id })
        .andWhere('buyer.organization_id = :organizationId', { organizationId })
        .andWhere('orderPlacement.deleted_at IS NULL')
        .getOne();

      if (!orderPlacement) {
        throw new NotFoundException('Order placement not found in the selected organization.');
      }

      const targetJobId = dto.jobId ?? orderPlacement.jobId;

      if (dto.orderPlacementDetails !== undefined) {
        await this.validateDetails(dto.orderPlacementDetails, targetJobId, organizationId);
      }

      if (dto.buyerId !== undefined) {
        orderPlacement.buyerId = dto.buyerId;
      }

      if (dto.jobId !== undefined) {
        orderPlacement.jobId = dto.jobId;
      }

      if (dto.currencyId !== undefined) {
        orderPlacement.currencyId = dto.currencyId;
      }

      if (dto.placementDate !== undefined) {
        orderPlacement.placementDate = this.parseRequiredDate(dto.placementDate, 'Placement date');
      }

      if (dto.factoryId !== undefined) {
        orderPlacement.factoryId = dto.factoryId;
      }

      if (dto.isPlaced !== undefined) {
        orderPlacement.isPlaced = dto.isPlaced;
      }

      orderPlacement.updated_by_id = userId;

      await manager.getRepository(OrderPlacement).save(orderPlacement);

      if (dto.orderPlacementDetails !== undefined) {
        await this.syncDetails(orderPlacement.id, targetJobId, dto.orderPlacementDetails, userId, manager);
      }
    });

    return this.findOne(id, organizationId);
  }

  async remove(id: string, deletedById: string, organizationId: string) {
    await this.ensureOrderPlacementExists(id, organizationId);
    await this.orderPlacementRepository.update({ id }, { deleted_by_id: deletedById });
    return this.orderPlacementRepository.softDelete({ id });
  }

  async permanentRemove(id: string, organizationId: string) {
    await this.ensureOrderPlacementExists(id, organizationId, true);
    return this.orderPlacementRepository.delete({ id });
  }

  async restore(id: string, organizationId: string) {
    await this.ensureOrderPlacementExists(id, organizationId, true);
    return this.orderPlacementRepository.restore({ id });
  }

  private async syncDetails(
    orderPlacementId: string,
    orderPlacementJobId: string,
    details: CreateOrderPlacementDetailDto[],
    userId: string,
    manager: EntityManager = this.dataSource.manager,
  ) {
    const repository = manager.getRepository(OrderPlacementDetails);
    const existingDetails = await repository.find({ where: { orderPlacementId } });
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
      await repository.delete({ id: In(removedDetailIds) });
    }

    for (const detail of details) {
      const existingDetail = detail.id ? existingById.get(detail.id) : undefined;
      const sourceDetail = detail.jobDetailId
        ? await this.findJobDetailOrFailWithManager(manager, detail.jobDetailId, orderPlacementJobId)
        : null;
      const entity = existingDetail ?? repository.create({ orderPlacementId, created_by_id: userId });
      const resolved = this.resolveDetailPayload(detail, sourceDetail, orderPlacementJobId);
      const quantity = this.numberOrDefault(resolved.quantity, 0);
      const factoryCm = this.numberOrDefault(detail.factoryCm, 0);
      const factoryFob = this.numberOrDefault(detail.factoryFob, 0);

      entity.orderPlacementId = orderPlacementId;
      entity.jobDetailId = detail.jobDetailId ?? sourceDetail?.id ?? null;
      entity.jobId = resolved.jobId;
      entity.poId = resolved.poId;
      entity.styleId = resolved.styleId;
      entity.sizeId = resolved.sizeId;
      entity.colorId = resolved.colorId;
      entity.quantity = quantity;
      entity.fob = this.numberOrDefault(resolved.fob, 0);
      entity.cm = this.numberOrDefault(resolved.cm, 0);
      entity.deliveryDate = this.parseOptionalDate(resolved.deliveryDate);
      entity.cuttingLimitPercentage = this.numberOrDefault(resolved.cuttingLimitPercentage, 0);
      entity.remarks = this.normalizeString(resolved.remarks);
      entity.factoryCm = factoryCm;
      entity.factoryFob = factoryFob;
      entity.factoryShipmentDate = this.parseOptionalDate(detail.factoryShipmentDate);
      entity.totalFactoryCm = this.numberOrDefault(detail.totalFactoryCm, quantity * (factoryCm / 12));
      entity.totalFactoryFob = this.numberOrDefault(detail.totalFactoryFob, quantity * factoryFob);

      if (existingDetail) {
        entity.updated_by_id = userId;
      } else {
        entity.updated_by_id = null as unknown as string;
        entity.updated_at = null as unknown as Date;
      }

      await repository.save(entity);
    }
  }

  private async validateDetails(details: CreateOrderPlacementDetailDto[], orderPlacementJobId: string, organizationId: string) {
    for (const detail of details) {
      if (detail.jobDetailId) {
        await this.findJobDetailOrFail(detail.jobDetailId, orderPlacementJobId, organizationId);
        continue;
      }

      const missingFields = [
        ['jobId', detail.jobId],
        ['poId', detail.poId],
        ['styleId', detail.styleId],
        ['sizeId', detail.sizeId],
        ['colorId', detail.colorId],
      ]
        .filter(([, value]) => value === undefined || value === null || value === '')
        .map(([field]) => field);

      if (missingFields.length) {
        throw new BadRequestException(`Order placement detail is missing: ${missingFields.join(', ')}.`);
      }

      if (detail.jobId !== orderPlacementJobId) {
        throw new BadRequestException('Order placement detail job must match the selected job.');
      }

      await Promise.all([
        this.findPurchaseOrderOrFail(detail.poId as string),
        this.findStyleOrFail(detail.styleId as string, organizationId),
        this.findSizeOrFail(detail.sizeId as number, organizationId),
        this.findColorOrFail(detail.colorId as number, organizationId),
      ]);
    }
  }

  private resolveDetailPayload(detail: CreateOrderPlacementDetailDto, sourceDetail: JobDetails | null, orderPlacementJobId: string) {
    const jobId = detail.jobId ?? sourceDetail?.jobId;
    const poId = detail.poId ?? sourceDetail?.poId;
    const styleId = detail.styleId ?? sourceDetail?.styleId;
    const sizeId = detail.sizeId ?? sourceDetail?.sizeId;
    const colorId = detail.colorId ?? sourceDetail?.colorId;

    if (!jobId || !poId || !styleId || sizeId === undefined || colorId === undefined) {
      throw new BadRequestException('Order placement detail requires either a valid jobDetailId or all job detail columns.');
    }

    if (jobId !== orderPlacementJobId) {
      throw new BadRequestException('Order placement detail job must match the selected job.');
    }

    return {
      jobId,
      poId,
      styleId,
      sizeId,
      colorId,
      quantity: detail.quantity ?? sourceDetail?.quantity ?? 0,
      fob: detail.fob ?? sourceDetail?.fob ?? 0,
      cm: detail.cm ?? sourceDetail?.cm ?? 0,
      deliveryDate: detail.deliveryDate ?? sourceDetail?.deliveryDate ?? null,
      cuttingLimitPercentage: detail.cuttingLimitPercentage ?? sourceDetail?.cuttingLimitPercentage ?? 0,
      remarks: detail.remarks ?? sourceDetail?.remarks ?? null,
    };
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

  private async findCurrencyOrFail(currencyId: number, organizationId: string) {
    const currency = await this.currencyRepository.findOne({
      where: { id: currencyId, organizationId },
    });

    if (!currency) {
      throw new BadRequestException('Currency not found in the selected organization.');
    }

    return currency;
  }

  private async findSupplierOrFail(supplierId: string, organizationId: string) {
    const supplier = await this.supplierRepository.findOne({
      where: { id: supplierId, organizationId },
    });

    if (!supplier) {
      throw new BadRequestException('Factory supplier not found in the selected organization.');
    }

    return supplier;
  }

  private async findPurchaseOrderOrFail(poId: string) {
    const purchaseOrder = await this.purchaseOrderRepository.findOne({ where: { id: poId } });

    if (!purchaseOrder) {
      throw new BadRequestException('Purchase order not found.');
    }

    return purchaseOrder;
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

  private async findJobDetailOrFail(jobDetailId: string, orderPlacementJobId: string, organizationId: string) {
    const jobDetail = await this.jobDetailsRepository
      .createQueryBuilder('jobDetail')
      .innerJoin('jobDetail.job', 'job')
      .innerJoin('job.factory', 'factory')
      .where('jobDetail.id = :jobDetailId', { jobDetailId })
      .andWhere('jobDetail.job_id = :jobId', { jobId: orderPlacementJobId })
      .andWhere('factory.organization_id = :organizationId', { organizationId })
      .andWhere('job.deleted_at IS NULL')
      .andWhere('jobDetail.deleted_at IS NULL')
      .getOne();

    if (!jobDetail) {
      throw new BadRequestException('Job detail not found in the selected organization.');
    }

    return jobDetail;
  }

  private async findJobDetailOrFailWithManager(manager: EntityManager, jobDetailId: string, orderPlacementJobId: string) {
    const jobDetail = await manager
      .getRepository(JobDetails)
      .createQueryBuilder('jobDetail')
      .where('jobDetail.id = :jobDetailId', { jobDetailId })
      .andWhere('jobDetail.job_id = :jobId', { jobId: orderPlacementJobId })
      .andWhere('jobDetail.deleted_at IS NULL')
      .getOne();

    if (!jobDetail) {
      throw new BadRequestException('Job detail not found in the selected job.');
    }

    return jobDetail;
  }

  private async ensureOrderPlacementExists(id: string, organizationId: string, includeDeleted = false) {
    const queryBuilder = this.orderPlacementRepository
      .createQueryBuilder('orderPlacement')
      .leftJoin('orderPlacement.buyer', 'buyer')
      .where('orderPlacement.id = :id', { id })
      .andWhere('buyer.organization_id = :organizationId', { organizationId });

    if (includeDeleted) {
      queryBuilder.withDeleted();
    } else {
      queryBuilder.andWhere('orderPlacement.deleted_at IS NULL');
    }

    const orderPlacement = await queryBuilder.getOne();

    if (!orderPlacement) {
      throw new NotFoundException('Order placement not found in the selected organization.');
    }

    return orderPlacement;
  }

  private parseRequiredDate(value: string | Date, label: string) {
    if (value instanceof Date) {
      if (Number.isNaN(value.getTime())) {
        throw new BadRequestException(`${label} must be a valid date.`);
      }

      return value;
    }

    const parsed = new Date(value.trim());

    if (Number.isNaN(parsed.getTime())) {
      throw new BadRequestException(`${label} must be a valid date.`);
    }

    return parsed;
  }

  private parseOptionalDate(value: string | Date | null | undefined) {
    if (!value) {
      return null;
    }

    if (value instanceof Date) {
      return Number.isNaN(value.getTime()) ? null : value;
    }

    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }

    const parsed = new Date(trimmed);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  private numberOrDefault(value: number | string | null | undefined, fallback: number) {
    const numberValue = Number(value);
    return Number.isFinite(numberValue) ? numberValue : fallback;
  }

  private normalizeString(value: string | null | undefined) {
    const trimmed = value?.trim() ?? '';
    return trimmed || null;
  }

  private parseBoolean(value: boolean | string | null | undefined) {
    if (typeof value === 'boolean') {
      return value;
    }

    return ['true', 'yes', 'y', '1', 'active', 'placed'].includes(value?.trim().toLowerCase() ?? '');
  }
}
