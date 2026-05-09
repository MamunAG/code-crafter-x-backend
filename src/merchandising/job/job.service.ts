import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import axios from 'axios';
import { PDFParse } from 'pdf-parse';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { Factory } from 'src/app-configuration/factory/entity/factory.entity';
import { Currency } from 'src/app-configuration/currency/entity/currency.entity';
import { PaginatedResponseDto } from 'src/common/dto/paginated-response.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { Buyer } from 'src/merchandising/buyer/entity/buyer.entity';
import { Color } from 'src/merchandising/master-data/color/entity/color.entity';
import { Size } from 'src/merchandising/master-data/size/entity/size.entity';
import { Style } from 'src/merchandising/style/entity/style.entity';
import { StyleToColorMap } from 'src/merchandising/style/entity/style-to-color-map.entity';
import { StyleToSizeMap } from 'src/merchandising/style/entity/style-to-size-map.entity';
import { Employee } from 'src/hr-payroll/employee/entity/employee.entity';
import * as XLSX from 'xlsx';
import { CreateJobDetailDto } from './dto/create-job-detail.dto';
import { CreateJobDto } from './dto/create-job.dto';
import { FilterJobDto } from './dto/filter-job.dto';
import { ResolveAiAssistRowDto } from './dto/resolve-ai-assist-row.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { JobDetails } from './entity/job-details.entity';
import { Job } from './entity/job.entity';
import { PurchaseOrder } from './entity/purchase-order.entity';

type JobListFilters = Partial<FilterJobDto> & {
  deletedOnly?: string | boolean;
};

type JobAiAssistRow = {
  poNumber: string;
  styleNo: string;
  styleName: string;
  color: string;
  size: string;
  quantity: number;
  deliveryDate: string | null;
  fob: number | null;
};

type OpenRouterChatResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
};

const AI_ASSIST_TEXT_LIMIT = 30000;
const AI_ASSIST_ALLOWED_EXTENSIONS = new Set(['pdf', 'xls', 'xlsx', 'csv']);

type AiAssistResolvedOption = {
  value: string;
  label: string;
};

type AiAssistResolvedMasterData = {
  styleOption: AiAssistResolvedOption | null;
  sizeOption: AiAssistResolvedOption | null;
  colorOption: AiAssistResolvedOption | null;
};

type JobPoSummaryRow = {
  id: string;
  jobId: string;
  jobNo: string;
  poNumber: string;
  styleNo: string;
  styleName: string | null;
  sizeName: string;
  colorName: string;
  quantity: number;
  fob: number;
  totalFob: number;
  cmPerDzn: number;
  totalCm: number;
  deliveryDate: string | null;
  cuttingLimitPercentage: number;
  remarks: string | null;
  factoryName: string;
  buyerName: string;
  isActive: boolean;
};

type JobPoSummaryGroup = {
  poNumber: string;
  jobCount: number;
  rowCount: number;
  totalQuantity: number;
  totalFob: number;
  totalCm: number;
  rows: JobPoSummaryRow[];
};

type JobPoSummaryResult = {
  search: string;
  totalPoCount: number;
  totalJobCount: number;
  totalRowCount: number;
  totalQuantity: number;
  totalFob: number;
  totalCm: number;
  groups: JobPoSummaryGroup[];
};

type PoDetailsTemplateRow = {
  poNumber: string;
  styleNo: string;
  styleName: string | null;
  color: string;
  size: string;
  quantity: number;
  fob: number;
  cm: number;
  deliveryDate: string | null;
  cuttingLimitPercentage: number;
  remarks: string | null;
};

type ResolvedPoDetailsTemplateRow = {
  pono: string;
  styleId: string;
  styleLabel: string;
  sizeId: string;
  sizeLabel: string;
  colorId: string;
  colorLabel: string;
  quantity: string;
  fob: string;
  cm: string;
  deliveryDate: string;
  cuttingLimitPercentage: string;
  remarks: string;
};

@Injectable()
export class JobService {
  constructor(
    private dataSource: DataSource,

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

    @InjectRepository(StyleToColorMap)
    private styleToColorMapRepository: Repository<StyleToColorMap>,

    @InjectRepository(StyleToSizeMap)
    private styleToSizeMapRepository: Repository<StyleToSizeMap>,

    @InjectRepository(Size)
    private sizeRepository: Repository<Size>,

    @InjectRepository(Color)
    private colorRepository: Repository<Color>,

    @InjectRepository(Currency)
    private currencyRepository: Repository<Currency>,

    @InjectRepository(Employee)
    private employeeRepository: Repository<Employee>,
  ) { }

  async create(dto: CreateJobDto, userId: string, organizationId: string) {
    await this.findFactoryOrFail(dto.factoryId, organizationId);
    await this.findBuyerOrFail(dto.buyerId, organizationId);
    if (dto.merchandiserId !== undefined && dto.merchandiserId !== null) {
      await this.findEmployeeOrFail(dto.merchandiserId, organizationId);
    }

    const details = dto.jobDetails ?? [];
    await this.validateDetails(details, organizationId);
    const customJobNo = this.normalizeCustomJobNo(dto.jobNo);

    const savedJobId = await this.dataSource.transaction(async (manager) => {
      await this.lockJobSerialForOrganization(manager, organizationId);
      const nextJobNumber = customJobNo
        ? await this.getNextJobNumber(manager, organizationId)
        : await this.getNextAvailableJobNumber(manager, organizationId);

      if (customJobNo) {
        await this.ensureJobNoAvailable(customJobNo, organizationId, manager);
      }

      const job = manager.getRepository(Job).create({
        jobNo: customJobNo ?? nextJobNumber.jobNo,
        jobSerial: nextJobNumber.jobSerial,
        factoryId: dto.factoryId,
        buyerId: dto.buyerId,
        merchandiserId: dto.merchandiserId ?? undefined,
        ordertype: dto.ordertype ?? undefined,
        totalPoQty: details.length ? this.sumDetailQuantity(details) : this.numberOrDefault(dto.totalPoQty, 0),
        poReceiveDate: this.parseOptionalDate(dto.poReceiveDate) ?? undefined,
        isActive: dto.isActive === undefined ? true : dto.isActive,
        created_by_id: userId,
        updated_by_id: null as unknown as string,
        updated_at: null as unknown as Date,
      });

      const savedJob = await manager.getRepository(Job).save(job);
      await this.syncJobDetails(savedJob.id, details, userId, manager);

      return savedJob.id;
    });

    return this.findOne(savedJobId, organizationId);
  }

  async getNextJobNumberPreview(organizationId: string) {
    return this.getNextJobNumber(this.dataSource.manager, organizationId);
  }

  buildPoDetailsUploadTemplate() {
    return [
      'poNumber,styleNo,styleName,color,size,quantity,fob,cm,deliveryDate,cuttingLimitPercentage,remarks',
      'PO-001,ST-001,Summer Shirt,Blue,M,120,4.5,18,2026-06-30,5,Sample row',
    ].join('\n');
  }

  async validatePoDetailsTemplate(file: Express.Multer.File | undefined, organizationId: string) {
    if (!file?.buffer?.length) {
      throw new BadRequestException('Please upload a PO details template file.');
    }

    const rows = this.parsePoDetailsTemplate(file);

    if (!rows.length) {
      return {
        inserted: 0,
        skipped: 0,
        rows: [] as ResolvedPoDetailsTemplateRow[],
      };
    }

    const [styles, sizes, colors] = await Promise.all([
      this.styleRepository
        .createQueryBuilder('style')
        .where('style.organization_id = :organizationId', { organizationId })
        .andWhere('style.deleted_at IS NULL')
        .andWhere('style.is_active = :isActive', { isActive: true })
        .getMany(),
      this.sizeRepository
        .createQueryBuilder('size')
        .where('size.organization_id = :organizationId', { organizationId })
        .andWhere('size.deleted_at IS NULL')
        .andWhere('size.is_active = :isActive', { isActive: true })
        .getMany(),
      this.colorRepository
        .createQueryBuilder('color')
        .where('color.organization_id = :organizationId', { organizationId })
        .andWhere('color.deleted_at IS NULL')
        .andWhere('color.is_active = :isActive', { isActive: true })
        .getMany(),
    ]);

    const styleByNo = new Map(styles.map((style) => [style.styleNo?.trim().toLowerCase(), style] as const).filter((entry): entry is readonly [string, Style] => Boolean(entry[0])));
    const sizeByName = new Map(sizes.map((size) => [size.sizeName?.trim().toLowerCase(), size] as const).filter((entry): entry is readonly [string, Size] => Boolean(entry[0])));
    const colorByName = new Map<string, Color>();
    for (const color of colors) {
      const colorName = color.colorName?.trim().toLowerCase();
      const displayName = color.colorDisplayName?.trim().toLowerCase();
      if (colorName) colorByName.set(colorName, color);
      if (displayName) colorByName.set(displayName, color);
    }

    const missingStyles = new Map<string, PoDetailsTemplateRow>();
    const missingSizes = new Set<string>();
    const missingColors = new Set<string>();
    const resolvedRows: ResolvedPoDetailsTemplateRow[] = [];

    for (const row of rows) {
      const style = styleByNo.get(row.styleNo.trim().toLowerCase());
      const size = sizeByName.get(row.size.trim().toLowerCase());
      const color = colorByName.get(row.color.trim().toLowerCase());

      if (!style) missingStyles.set(row.styleNo, row);
      if (!size) missingSizes.add(row.size);
      if (!color) missingColors.add(row.color);

      if (!style || !size || !color) continue;

      resolvedRows.push({
        pono: row.poNumber,
        styleId: style.id,
        styleLabel: this.formatStyleLabel(style.styleNo, style.styleName),
        sizeId: String(size.id),
        sizeLabel: size.sizeName,
        colorId: String(color.id),
        colorLabel: color.colorDisplayName?.trim() || color.colorName,
        quantity: this.formatTemplateNumber(row.quantity),
        fob: this.formatTemplateNumber(row.fob),
        cm: this.formatTemplateNumber(row.cm),
        deliveryDate: row.deliveryDate ?? '',
        cuttingLimitPercentage: this.formatTemplateNumber(row.cuttingLimitPercentage),
        remarks: row.remarks ?? '',
      });
    }

    this.throwPoDetailsMissingSetupError(missingStyles, missingSizes, missingColors, rows.length);

    return {
      inserted: resolvedRows.length,
      skipped: rows.length - resolvedRows.length,
      rows: resolvedRows,
    };
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
      .leftJoinAndSelect('job.merchandiser', 'merchandiser')
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
      .leftJoinAndSelect('job.merchandiser', 'merchandiser')
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

  async getPoSummary(pono: string | undefined, organizationId: string): Promise<JobPoSummaryResult> {
    const search = pono?.trim();

    if (!search) {
      throw new BadRequestException('Please enter a PO number to view the PO summary.');
    }

    const details = await this.jobDetailsRepository
      .createQueryBuilder('detail')
      .innerJoinAndSelect('detail.job', 'job')
      .innerJoinAndSelect('job.factory', 'factory')
      .innerJoinAndSelect('job.buyer', 'buyer')
      .innerJoinAndSelect('detail.purchaseOrder', 'purchaseOrder')
      .innerJoinAndSelect('detail.style', 'style')
      .innerJoinAndSelect('detail.size', 'size')
      .innerJoinAndSelect('detail.color', 'color')
      .where('factory.organization_id = :organizationId', { organizationId })
      .andWhere('job.deleted_at IS NULL')
      .andWhere('detail.deleted_at IS NULL')
      .andWhere('purchaseOrder.pono ILIKE :pono', { pono: `%${search}%` })
      .orderBy('purchaseOrder.pono', 'ASC')
      .addOrderBy('job.job_no', 'ASC')
      .addOrderBy('detail.created_at', 'ASC')
      .getMany();

    const groups = new Map<string, JobPoSummaryGroup>();
    const groupJobIds = new Map<string, Set<string>>();
    const totalJobIds = new Set<string>();

    for (const detail of details) {
      const poNumber = detail.purchaseOrder?.pono ?? '';
      const quantity = this.numberOrDefault(detail.quantity, 0);
      const fob = this.numberOrDefault(detail.fob, 0);
      const cmPerDzn = this.numberOrDefault(detail.cm, 0);
      const totalFob = quantity * fob;
      const totalCm = quantity * (cmPerDzn / 12);
      const group = groups.get(poNumber) ?? {
        poNumber,
        jobCount: 0,
        rowCount: 0,
        totalQuantity: 0,
        totalFob: 0,
        totalCm: 0,
        rows: [],
      };

      group.rowCount += 1;
      group.totalQuantity += quantity;
      group.totalFob += totalFob;
      group.totalCm += totalCm;
      totalJobIds.add(detail.jobId);

      const jobIdsForGroup = groupJobIds.get(poNumber) ?? new Set<string>();
      jobIdsForGroup.add(detail.jobId);
      groupJobIds.set(poNumber, jobIdsForGroup);
      group.jobCount = jobIdsForGroup.size;

      group.rows.push({
        id: detail.id,
        jobId: detail.jobId,
        jobNo: detail.job?.jobNo ?? '',
        poNumber,
        styleNo: detail.style?.styleNo ?? '',
        styleName: detail.style?.styleName ?? null,
        sizeName: detail.size?.sizeName ?? '',
        colorName: detail.color?.colorDisplayName || detail.color?.colorName || '',
        quantity,
        fob,
        totalFob,
        cmPerDzn,
        totalCm,
        deliveryDate: this.formatDateForResponse(detail.deliveryDate),
        cuttingLimitPercentage: this.numberOrDefault(detail.cuttingLimitPercentage, 0),
        remarks: detail.remarks ?? null,
        factoryName: detail.job?.factory?.displayName || detail.job?.factory?.name || '',
        buyerName: detail.job?.buyer?.displayName || detail.job?.buyer?.name || '',
        isActive: detail.job?.isActive ?? false,
      });

      groups.set(poNumber, group);
    }

    const summaryGroups = Array.from(groups.values());

    return {
      search,
      totalPoCount: summaryGroups.length,
      totalJobCount: totalJobIds.size,
      totalRowCount: summaryGroups.reduce((total, group) => total + group.rowCount, 0),
      totalQuantity: summaryGroups.reduce((total, group) => total + group.totalQuantity, 0),
      totalFob: summaryGroups.reduce((total, group) => total + group.totalFob, 0),
      totalCm: summaryGroups.reduce((total, group) => total + group.totalCm, 0),
      groups: summaryGroups,
    };
  }

  async update(id: string, dto: UpdateJobDto, userId: string, organizationId: string) {
    if (dto.factoryId !== undefined) {
      await this.findFactoryOrFail(dto.factoryId, organizationId);
    }

    if (dto.buyerId !== undefined) {
      await this.findBuyerOrFail(dto.buyerId, organizationId);
    }

    if (dto.merchandiserId != null) {
      await this.findEmployeeOrFail(dto.merchandiserId, organizationId);
    }

    if (dto.jobDetails !== undefined) {
      await this.validateDetails(dto.jobDetails, organizationId);
    }
    const customJobNo = this.normalizeCustomJobNo(dto.jobNo);

    await this.dataSource.transaction(async (manager) => {
      await this.lockJobSerialForOrganization(manager, organizationId);
      const job = await manager
        .getRepository(Job)
        .createQueryBuilder('job')
        .leftJoinAndSelect('job.factory', 'factory')
        .leftJoinAndSelect('job.merchandiser', 'merchandiser')
        .where('job.id = :id', { id })
        .andWhere('factory.organization_id = :organizationId', { organizationId })
        .andWhere('job.deleted_at IS NULL')
        .getOne();

      if (!job) {
        throw new NotFoundException('Job not found in the selected organization.');
      }

      if (customJobNo) {
        await this.ensureJobNoAvailable(customJobNo, organizationId, manager, id);
        job.jobNo = customJobNo;
      }

      if (dto.factoryId !== undefined) {
        job.factoryId = dto.factoryId;
      }

      if (dto.buyerId !== undefined) {
        job.buyerId = dto.buyerId;
      }

      if (dto.merchandiserId != null) {
        job.merchandiserId = dto.merchandiserId;
      } else if (dto.merchandiserId === null) {
        job.merchandiserId = null;
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
        job.totalPoQty = this.sumDetailQuantity(dto.jobDetails);
      } else if (dto.totalPoQty !== undefined) {
        job.totalPoQty = this.numberOrDefault(dto.totalPoQty, 0);
      }

      job.updated_by_id = userId;
      job.updated_at = new Date();
      await manager.getRepository(Job).save(job);

      if (dto.jobDetails !== undefined) {
        await this.syncJobDetails(id, dto.jobDetails, userId, manager);
      }
    });

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

  async analyzeAiAssistFile(file?: Express.Multer.File) {
    if (!file?.buffer?.length) {
      throw new BadRequestException('Please upload a PDF or Excel file for AI Assist.');
    }

    const extension = this.getFileExtension(file.originalname);
    if (!AI_ASSIST_ALLOWED_EXTENSIONS.has(extension)) {
      throw new BadRequestException('AI Assist supports PDF, XLS, XLSX, and CSV files only.');
    }

    const extractedText = await this.extractAiAssistText(file, extension);
    if (!extractedText.trim()) {
      throw new BadRequestException('No readable PO detail data was found in the uploaded file.');
    }

    const rows = await this.extractAiAssistRowsWithOpenRouter(extractedText);
    return { rows };
  }

  async resolveAiAssistRow(dto: ResolveAiAssistRowDto, userId: string, organizationId: string): Promise<AiAssistResolvedMasterData> {
    const row = this.normalizeResolveAiAssistRow(dto);

    return this.dataSource.transaction(async (manager) => {
      const color = await this.findOrCreateAiAssistColor(manager, row.color, userId, organizationId);
      const size = await this.findOrCreateAiAssistSize(manager, row.size, userId, organizationId);
      const style = await this.findOrCreateAiAssistStyle(manager, row, color, size, userId, organizationId);

      return {
        styleOption: style ? this.toAiAssistStyleOption(style) : null,
        sizeOption: size ? this.toAiAssistSizeOption(size) : null,
        colorOption: color ? this.toAiAssistColorOption(color) : null,
      };
    });
  }

  private async getNextJobNumber(manager: EntityManager, organizationId: string) {
    const result = await manager
      .getRepository(Job)
      .createQueryBuilder('job')
      .withDeleted()
      .innerJoin('job.factory', 'factory')
      .select('COALESCE(MAX(job.jobSerial), 0)', 'maxSerial')
      .where('factory.organization_id = :organizationId', { organizationId })
      .getRawOne<{ maxSerial: string | number | null }>();

    const jobSerial = Number(result?.maxSerial ?? 0) + 1;
    return {
      jobNo: `JOB-${jobSerial}`,
      jobSerial,
    };
  }

  private async getNextAvailableJobNumber(manager: EntityManager, organizationId: string) {
    let nextJobNumber = await this.getNextJobNumber(manager, organizationId);

    while (await this.findExistingJobNo(nextJobNumber.jobNo, organizationId, manager)) {
      nextJobNumber = {
        jobNo: `JOB-${nextJobNumber.jobSerial + 1}`,
        jobSerial: nextJobNumber.jobSerial + 1,
      };
    }

    return nextJobNumber;
  }

  private async lockJobSerialForOrganization(manager: EntityManager, organizationId: string) {
    await manager.query('SELECT pg_advisory_xact_lock(hashtext($1)::bigint)', [`job-serial:${organizationId}`]);
  }

  private normalizeCustomJobNo(value?: string | null) {
    if (value === undefined || value === null) {
      return undefined;
    }

    const normalized = value.trim();

    if (!normalized) {
      return undefined;
    }

    if (normalized.length > 50) {
      throw new BadRequestException('Job number cannot be longer than 50 characters.');
    }

    return normalized;
  }

  private async ensureJobNoAvailable(jobNo: string, organizationId: string, manager: EntityManager, excludeJobId?: string) {
    const existing = await this.findExistingJobNo(jobNo, organizationId, manager, excludeJobId);

    if (existing) {
      const nextJobNumber = await this.getNextAvailableJobNumber(manager, organizationId);
      throw new BadRequestException(
        `Job number "${jobNo}" already exists in the system. The next available job number is ${nextJobNumber.jobNo}. You can continue with ${nextJobNumber.jobNo} or enter another job number.`,
      );
    }
  }

  private async findExistingJobNo(jobNo: string, organizationId: string, manager: EntityManager, excludeJobId?: string) {
    const queryBuilder = manager
      .getRepository(Job)
      .createQueryBuilder('job')
      .withDeleted()
      .innerJoin('job.factory', 'factory')
      .where('factory.organization_id = :organizationId', { organizationId })
      .andWhere('LOWER(TRIM(job.jobNo)) = :jobNo', { jobNo: jobNo.trim().toLowerCase() });

    if (excludeJobId) {
      queryBuilder.andWhere('job.id <> :excludeJobId', { excludeJobId });
    }

    return queryBuilder.getOne();
  }

  private async syncJobDetails(jobId: string, details: CreateJobDetailDto[], userId: string, manager: EntityManager = this.dataSource.manager) {
    const jobDetailsRepository = manager.getRepository(JobDetails);
    await jobDetailsRepository.delete({ jobId });

    if (!details.length) {
      return;
    }

    const existingPos: Record<string, PurchaseOrder> = {};

    for (const detail of details) {
      if (!existingPos[detail.pono]) {
        const res = await this.findOrCreatePurchaseOrder(
          detail.pono,
          userId,
          manager,
        );

        existingPos[detail.pono] = res;
      }
    }

    const entities = details.map((detail) => {
      const purchaseOrder = existingPos[detail.pono];

      return jobDetailsRepository.create({
        jobId,
        poId: purchaseOrder.id,
        styleId: detail.styleId,
        sizeId: detail.sizeId,
        colorId: detail.colorId,
        quantity: this.numberOrDefault(detail.quantity, 0),
        fob: this.numberOrDefault(detail.fob, 0),
        cm: this.numberOrDefault(detail.cm, 0),
        deliveryDate: this.parseOptionalDate(detail.deliveryDate) ?? undefined,
        cuttingLimitPercentage: this.numberOrDefault(detail.cuttingLimitPercentage, 0),
        remarks: this.nullableString(detail.remarks) ?? undefined,
        created_by_id: userId,
        updated_by_id: null as unknown as string,
        updated_at: null as unknown as Date,
      });
    })

    await jobDetailsRepository.save(entities);
  }

  private async findOrCreatePurchaseOrder(pono: string, userId: string, manager: EntityManager = this.dataSource.manager) {
    const normalizedPono = pono.trim();
    const purchaseOrderRepository = manager.getRepository(PurchaseOrder);

    if (!normalizedPono) {
      throw new BadRequestException('PO number is required for each job detail row.');
    }

    const existing = await purchaseOrderRepository
      .createQueryBuilder('purchaseOrder')
      .where('LOWER(TRIM(purchaseOrder.pono)) = :pono', { pono: normalizedPono.toLowerCase() })
      .getOne();

    if (existing) {
      return existing;
    }

    try {
      return await purchaseOrderRepository.save(
        purchaseOrderRepository.create({
          pono: normalizedPono,
          created_by_id: userId,
          updated_by_id: null as unknown as string,
          updated_at: null as unknown as Date,
        }),
      );
    } catch {
      const purchaseOrder = await purchaseOrderRepository
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

  private normalizeResolveAiAssistRow(dto: ResolveAiAssistRowDto) {
    return {
      poNumber: this.nullableString(dto.poNumber) ?? '',
      styleNo: this.nullableString(dto.styleNo) ?? '',
      styleName: this.nullableString(dto.styleName),
      color: this.nullableString(dto.color) ?? '',
      size: this.nullableString(dto.size) ?? '',
      quantity: this.numberOrDefault(dto.quantity, 0),
      deliveryDate: this.nullableString(dto.deliveryDate),
      fob: this.nullableNumber(dto.fob),
      buyerId: this.nullableString(dto.buyerId) ?? '',
    };
  }

  private async findOrCreateAiAssistColor(manager: EntityManager, colorName: string, userId: string, organizationId: string) {
    const normalizedColorName = colorName.trim();

    if (!normalizedColorName) {
      return null;
    }

    const existing = await manager
      .getRepository(Color)
      .createQueryBuilder('color')
      .where('LOWER(TRIM(color.colorName)) = :colorName', { colorName: normalizedColorName.toLowerCase() })
      .andWhere('color.organization_id = :organizationId', { organizationId })
      .andWhere('color.deleted_at IS NULL')
      .getOne();

    if (existing) {
      return existing;
    }

    return manager.getRepository(Color).save(
      manager.getRepository(Color).create({
        colorName: normalizedColorName,
        colorDisplayName: normalizedColorName,
        colorDescription: 'Created from Job Entry AI Assist.',
        organizationId,
        colorHexCode: null,
        isActive: true,
        created_by_id: userId,
        updated_by_id: null as unknown as string,
        updated_at: null as unknown as Date,
      }),
    );
  }

  private async findOrCreateAiAssistSize(manager: EntityManager, sizeName: string, userId: string, organizationId: string) {
    const normalizedSizeName = sizeName.trim();

    if (!normalizedSizeName) {
      return null;
    }

    const existing = await manager
      .getRepository(Size)
      .createQueryBuilder('size')
      .where('LOWER(TRIM(size.sizeName)) = :sizeName', { sizeName: normalizedSizeName.toLowerCase() })
      .andWhere('size.organization_id = :organizationId', { organizationId })
      .andWhere('size.deleted_at IS NULL')
      .getOne();

    if (existing) {
      return existing;
    }

    return manager.getRepository(Size).save(
      manager.getRepository(Size).create({
        sizeName: normalizedSizeName,
        organizationId,
        isActive: true,
        created_by_id: userId,
        updated_by_id: null as unknown as string,
        updated_at: null as unknown as Date,
      }),
    );
  }

  private async findOrCreateAiAssistStyle(
    manager: EntityManager,
    row: {
      styleNo: string;
      styleName: string | null;
      buyerId: string;
    },
    color: Color | null,
    size: Size | null,
    userId: string,
    organizationId: string,
  ) {
    if (!row.styleNo.trim()) {
      return null;
    }

    const existing = await manager
      .getRepository(Style)
      .createQueryBuilder('style')
      .where('LOWER(TRIM(style.styleNo)) = :styleNo', { styleNo: row.styleNo.trim().toLowerCase() })
      .andWhere('style.organization_id = :organizationId', { organizationId })
      .andWhere('style.deleted_at IS NULL')
      .getOne();

    if (existing) {
      const nextStyleName = row.styleName?.trim();
      if (nextStyleName && !existing.styleName?.trim()) {
        await manager
          .getRepository(Style)
          .createQueryBuilder()
          .update(Style)
          .set({
            styleName: nextStyleName,
            updated_by_id: userId,
            updated_at: new Date(),
          })
          .where('id = :id', { id: existing.id })
          .execute();

        existing.styleName = nextStyleName;
      }

      await this.ensureAiAssistStyleMap(manager, existing.id, color, size, userId);
      return existing;
    }

    const buyerId = row.buyerId.trim();
    if (!buyerId) {
      throw new BadRequestException('Please select a buyer before adding a new style from AI Assist.');
    }

    const buyer = await this.findBuyerOrFailWithManager(manager, buyerId, organizationId);
    const currency = await this.findDefaultCurrencyOrFail(manager, organizationId);

    const style = await manager.getRepository(Style).save(
      manager.getRepository(Style).create({
        buyerId: buyer.id,
        buyer,
        organizationId,
        styleNo: row.styleNo.trim(),
        styleName: row.styleName?.trim() || undefined,
        itemType: '',
        productType: '',
        productDepartment: '',
        cmSewing: 0,
        currencyId: currency.id,
        currency,
        smvSewing: 0,
        smvSewingSideSeam: 0,
        smvCutting: 0,
        smvCuttingSideSeam: 0,
        smvFinishing: 0,
        imageId: undefined,
        remarks: 'Created from Job Entry AI Assist.',
        isActive: true,
        itemUom: 'Pcs',
        productFamily: '',
        created_by_id: userId,
        updated_by_id: null as unknown as string,
        updated_at: null as unknown as Date,
      }),
    );

    await this.ensureAiAssistStyleMap(manager, style.id, color, size, userId);
    return style;
  }

  private toAiAssistStyleOption(style: Style): AiAssistResolvedOption {
    const styleNo = style.styleNo.trim();
    const styleName = style.styleName?.trim() ?? '';

    return {
      value: style.id,
      label: styleNo && styleName ? `${styleNo} - ${styleName}` : styleNo || styleName || style.id,
    };
  }

  private toAiAssistSizeOption(size: Size): AiAssistResolvedOption {
    return {
      value: String(size.id),
      label: size.sizeName.trim() || String(size.id),
    };
  }

  private toAiAssistColorOption(color: Color): AiAssistResolvedOption {
    const label = color.colorDisplayName?.trim() || color.colorName?.trim() || String(color.id);
    return {
      value: String(color.id),
      label,
    };
  }

  private async ensureAiAssistStyleMap(manager: EntityManager, styleId: string, color: Color | null, size: Size | null, userId: string) {
    if (color) {
      await this.ensureAiAssistStyleToColorMap(manager, styleId, color.id, userId);
    }

    if (size) {
      await this.ensureAiAssistStyleToSizeMap(manager, styleId, size.id, userId);
    }
  }

  private async ensureAiAssistStyleToColorMap(manager: EntityManager, styleId: string, colorId: number, userId: string) {
    const repository = manager.getRepository(StyleToColorMap);
    const existing = await repository
      .createQueryBuilder('styleToColorMap')
      .where('styleToColorMap.style_id = :styleId', { styleId })
      .andWhere('styleToColorMap.color_id = :colorId', { colorId })
      .andWhere('styleToColorMap.deleted_at IS NULL')
      .getOne();

    if (existing) {
      return existing;
    }

    return repository.save(
      repository.create({
        styleId,
        colorId,
        created_by_id: userId,
        updated_by_id: null as unknown as string,
        updated_at: null as unknown as Date,
      }),
    );
  }

  private async ensureAiAssistStyleToSizeMap(manager: EntityManager, styleId: string, sizeId: number, userId: string) {
    const repository = manager.getRepository(StyleToSizeMap);
    const existing = await repository
      .createQueryBuilder('styleToSizeMap')
      .where('styleToSizeMap.style_id = :styleId', { styleId })
      .andWhere('styleToSizeMap.size_id = :sizeId', { sizeId })
      .andWhere('styleToSizeMap.deleted_at IS NULL')
      .getOne();

    if (existing) {
      return existing;
    }

    return repository.save(
      repository.create({
        styleId,
        sizeId,
        created_by_id: userId,
        updated_by_id: null as unknown as string,
        updated_at: null as unknown as Date,
      }),
    );
  }

  private async findBuyerOrFailWithManager(manager: EntityManager, buyerId: string, organizationId: string) {
    const buyer = await manager.getRepository(Buyer).findOne({
      where: { id: buyerId, organizationId },
    });

    if (!buyer) {
      throw new BadRequestException('Buyer not found in the selected organization.');
    }

    return buyer;
  }

  private async findDefaultCurrencyOrFail(manager: EntityManager, organizationId: string) {
    const currency = await manager
      .getRepository(Currency)
      .createQueryBuilder('currency')
      .where('currency.organization_id = :organizationId', { organizationId })
      .andWhere('currency.deleted_at IS NULL')
      .andWhere('currency.is_active = true')
      .orderBy('currency.is_default', 'DESC')
      .addOrderBy('currency.created_at', 'ASC')
      .getOne();

    if (!currency) {
      throw new BadRequestException('Please create an active currency before adding a new style from AI Assist.');
    }

    return currency;
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

  private async findEmployeeOrFail(employeeId: string, organizationId: string) {
    const employee = await this.employeeRepository.findOne({
      where: { id: employeeId, organizationId },
    });

    if (!employee) {
      throw new BadRequestException('Merchandiser not found in the selected organization.');
    }

    return employee;
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

  private formatDateForResponse(value: string | Date | null | undefined) {
    if (!value) {
      return null;
    }

    if (value instanceof Date) {
      return Number.isNaN(value.getTime()) ? null : value.toISOString().slice(0, 10);
    }

    const trimmedValue = value.trim();
    if (!trimmedValue) {
      return null;
    }

    const date = new Date(trimmedValue);
    return Number.isNaN(date.getTime()) ? trimmedValue : date.toISOString().slice(0, 10);
  }

  private parseBoolean(value: boolean | string | null | undefined) {
    if (typeof value === 'boolean') {
      return value;
    }

    return ['true', 'yes', 'y', '1', 'active'].includes(value?.trim().toLowerCase() ?? '');
  }

  private parsePoDetailsTemplate(file: Express.Multer.File) {
    const extension = this.getFileExtension(file.originalname);
    let sheetRows: Record<string, unknown>[] = [];

    if (['xls', 'xlsx', 'csv'].includes(extension)) {
      const workbook = XLSX.read(file.buffer, { type: 'buffer' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      sheetRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(firstSheet, { defval: '' });
    } else {
      throw new BadRequestException('Please upload a CSV, XLS, or XLSX PO details template file.');
    }

    if (!sheetRows.length) {
      throw new BadRequestException('The uploaded template does not contain any PO detail rows.');
    }

    return sheetRows.flatMap((rawRow) => {
      const row = this.normalizeTemplateRow(rawRow);
      const poNumber = this.getTemplateValue(row, 'ponumber', 'pono', 'po');
      const styleNo = this.getTemplateValue(row, 'styleno', 'style');
      const styleName = this.getTemplateValue(row, 'stylename');
      const color = this.getTemplateValue(row, 'color', 'colorname');
      const size = this.getTemplateValue(row, 'size', 'sizename');

      if (!poNumber && !styleNo && !color && !size) {
        return [];
      }

      if (!poNumber || !styleNo || !color || !size) {
        throw new BadRequestException('Each PO detail row must include poNumber, styleNo, color, and size.');
      }

      return [{
        poNumber,
        styleNo,
        styleName: styleName || null,
        color,
        size,
        quantity: this.numberOrDefault(this.getTemplateValue(row, 'quantity', 'qty'), 0),
        fob: this.numberOrDefault(this.getTemplateValue(row, 'fob'), 0),
        cm: this.numberOrDefault(this.getTemplateValue(row, 'cm'), 0),
        deliveryDate: this.formatDateForResponse(this.getTemplateValue(row, 'deliverydate', 'delivery')),
        cuttingLimitPercentage: this.numberOrDefault(this.getTemplateValue(row, 'cuttinglimitpercentage', 'cuttinglimit'), 0),
        remarks: this.nullableString(this.getTemplateValue(row, 'remarks')),
      }];
    });
  }

  private normalizeTemplateRow(row: Record<string, unknown>) {
    return Object.entries(row).reduce<Record<string, string>>((normalized, [key, value]) => {
      const normalizedKey = key.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
      normalized[normalizedKey] = value == null ? '' : String(value).trim();
      return normalized;
    }, {});
  }

  private getTemplateValue(row: Record<string, string>, ...keys: string[]) {
    for (const key of keys) {
      const value = row[key.toLowerCase()]?.trim();
      if (value) return value;
    }
    return '';
  }

  private throwPoDetailsMissingSetupError(styles: Map<string, PoDetailsTemplateRow>, sizes: Set<string>, colors: Set<string>, totalRows: number) {
    const missing = {
      styles: [...styles.keys()],
      styleRows: [...styles.values()].map((row) => ({
        poNumber: row.poNumber,
        styleNo: row.styleNo,
        styleName: row.styleName ?? '',
        color: row.color,
        size: row.size,
        quantity: row.quantity,
        deliveryDate: row.deliveryDate,
        fob: row.fob,
      })),
      sizes: [...sizes],
      colors: [...colors],
    };

    if (!missing.styles.length && !missing.sizes.length && !missing.colors.length) {
      return;
    }

    throw new BadRequestException({
      message: 'PO details upload could not be completed because required setup data is missing. Please add the missing setup records, then upload the template again.',
      uploadReport: {
        inserted: 0,
        skipped: totalRows,
        missing,
        rows: [],
      },
    });
  }

  private formatStyleLabel(styleNo?: string | null, styleName?: string | null) {
    return [styleNo?.trim(), styleName?.trim()].filter(Boolean).join(' - ') || '';
  }

  private formatTemplateNumber(value: number) {
    return Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/\.?0+$/, '');
  }

  private getFileExtension(fileName?: string) {
    const parts = fileName?.toLowerCase().split('.') ?? [];
    return parts.length > 1 ? parts[parts.length - 1] : '';
  }

  private async extractAiAssistText(file: Express.Multer.File, extension: string) {
    if (extension === 'pdf') {
      const parser = new PDFParse({ data: file.buffer });

      try {
        const result = await parser.getText();
        return this.limitAiAssistText(result.text ?? '');
      } finally {
        await parser.destroy();
      }
    }

    const workbook = XLSX.read(file.buffer, { type: 'buffer' });
    const sheetTexts = workbook.SheetNames.map((sheetName) => {
      const sheet = workbook.Sheets[sheetName];
      const csv = XLSX.utils.sheet_to_csv(sheet, { blankrows: false });
      return [`Sheet: ${sheetName}`, csv].filter(Boolean).join('\n');
    });

    return this.limitAiAssistText(sheetTexts.join('\n\n'));
  }

  private limitAiAssistText(text: string) {
    return text.replace(/\u0000/g, '').slice(0, AI_ASSIST_TEXT_LIMIT);
  }

  private async extractAiAssistRowsWithOpenRouter(extractedText: string) {
    const apiKey = process.env.OPEN_ROUTER_KEY?.trim();
    if (!apiKey) {
      throw new BadRequestException('OpenRouter key is not configured for AI Assist.');
    }

    const model = process.env.OPEN_ROUTER_MODEL?.trim() || 'openai/gpt-4o-mini';
    const systemPrompt = [
      'You are a careful garment merchandising purchase-order data extraction engine.',
      'Extract only line-level PO detail rows from document text, tables, or CSV-like sheet data.',
      'Return strict JSON only. Do not include markdown, comments, explanations, or extra keys.',
      'Output shape must be exactly: {"rows":[{"poNumber":"","styleNo":"","styleName":"","color":"","size":"","quantity":0,"deliveryDate":null,"fob":null}]}',
      'Rules:',
      '1. Create one row per PO/style/style name/color/size/quantity/deliveryDate/fob combination.',
      '2. If sizes are shown as columns (for example XS,S,M,L) with quantities under them, expand each non-zero size quantity into a separate row.',
      '3. If PO number, style no, style name, color, delivery date, ship date, or FOB appears once above multiple rows, carry that value forward until a new value is shown.',
      '4. Use deliveryDate from these labels only, in this priority: Delivery Date, Shipping Date, Shipment Date, Ship Date. If several are present, prefer the first available by this priority.',
      '5. Do not guess missing values. Use an empty string for missing text fields, null for missing deliveryDate and fob, and 0 only when quantity is unreadable.',
      '6. Quantity must be a number, not text. Remove commas from quantity values.',
      '7. FOB must be a number without currency symbols or commas when present; otherwise null.',
      '8. Preserve PO number, style no, style name, color, size, and deliveryDate exactly as written except trim extra whitespace.',
      '9. Never use order header Date, document Date, revision date, issue date, or amendment date as deliveryDate.',
      '10. Ignore totals, subtotals, grand totals, CM/Dzn, buyer names, addresses, descriptions, and remarks.',
      '11. If there are no valid detail rows, return {"rows":[]}.',
    ].join('\n');
    const userPrompt = [
      'Extract PO detail rows from the document text below.',
      'Required fields: poNumber, styleNo, styleName, color, size, quantity, deliveryDate, fob.',
      '',
      'DOCUMENT TEXT:',
      '```',
      extractedText,
      '```',
    ].join('\n');
    const response = await axios.post<OpenRouterChatResponse>(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model,
        temperature: 0,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: userPrompt,
          },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 60000,
      },
    );

    const content = response.data.choices?.[0]?.message?.content;
    if (!content) {
      throw new BadRequestException('AI Assist did not return any extracted rows.');
    }

    return this.normalizeAiAssistRows(this.parseAiAssistJson(content));
  }

  private parseAiAssistJson(content: string) {
    const trimmed = content.trim();
    const withoutFence = trimmed
      .replace(/^```(?:json)?/i, '')
      .replace(/```$/i, '')
      .trim();

    try {
      return JSON.parse(withoutFence);
    } catch {
      const jsonStart = withoutFence.indexOf('{');
      const jsonEnd = withoutFence.lastIndexOf('}');

      if (jsonStart >= 0 && jsonEnd > jsonStart) {
        return JSON.parse(withoutFence.slice(jsonStart, jsonEnd + 1));
      }

      throw new BadRequestException('AI Assist returned data in an unreadable format.');
    }
  }

  private normalizeAiAssistRows(payload: unknown): JobAiAssistRow[] {
    const sourceRows = Array.isArray(payload)
      ? payload
      : Array.isArray((payload as { rows?: unknown[] })?.rows)
        ? (payload as { rows: unknown[] }).rows
        : [];

    const rows = sourceRows
      .map((row) => this.normalizeAiAssistRow(row))
      .filter((row): row is JobAiAssistRow => Boolean(row));

    if (!rows.length) {
      throw new BadRequestException('AI Assist could not find PO detail rows in this file.');
    }

    return rows;
  }

  private normalizeAiAssistRow(row: unknown): JobAiAssistRow | null {
    if (!row || typeof row !== 'object') {
      return null;
    }

    const record = row as Record<string, unknown>;
    const normalizedRow = {
      poNumber: this.pickAiAssistString(record, ['poNumber', 'po_number', 'poNo', 'po_no', 'pono', 'PO Number']),
      styleNo: this.pickAiAssistString(record, ['styleNo', 'style_no', 'style', 'styleNumber', 'Style No', 'Style']),
      styleName: this.pickAiAssistString(record, ['styleName', 'style_name', 'styleDescription', 'style_description', 'description', 'Style Name', 'Style Description', 'Description']),
      color: this.pickAiAssistString(record, ['color', 'colour', 'Color', 'Colour']),
      size: this.pickAiAssistString(record, ['size', 'Size']),
      quantity: this.pickAiAssistNumber(record, ['quantity', 'qty', 'Quantity', 'Qty']),
      deliveryDate: this.pickAiAssistNullableString(record, [
        'deliveryDate',
        'delivery_date',
        'delivery',
        'shipDate',
        'ship_date',
        'ship',
        'shippingDate',
        'shipping_date',
        'shipping',
        'shipmentDate',
        'shipment_date',
        'Delivery Date',
        'Shipping Date',
        'Ship Date',
        'Shipment Date',
      ]),
      fob: this.pickAiAssistNullableNumber(record, ['fob', 'FOB', 'unitFob', 'unit_fob', 'price', 'Price']),
    };

    const hasAnyData =
      normalizedRow.poNumber ||
      normalizedRow.styleNo ||
      normalizedRow.styleName ||
      normalizedRow.color ||
      normalizedRow.size ||
      normalizedRow.quantity > 0 ||
      normalizedRow.deliveryDate ||
      normalizedRow.fob !== null;
    return hasAnyData ? normalizedRow : null;
  }

  private pickAiAssistString(record: Record<string, unknown>, keys: string[]) {
    for (const key of keys) {
      const value = record[key];
      if (value !== undefined && value !== null) {
        const text = String(value).trim();
        if (text) {
          return text;
        }
      }
    }

    return '';
  }

  private pickAiAssistNumber(record: Record<string, unknown>, keys: string[]) {
    for (const key of keys) {
      const value = record[key];
      if (value !== undefined && value !== null && value !== '') {
        const numberValue = Number(String(value).replace(/,/g, '').trim());
        if (Number.isFinite(numberValue)) {
          return numberValue;
        }
      }
    }

    return 0;
  }

  private pickAiAssistNullableString(record: Record<string, unknown>, keys: string[]) {
    for (const key of keys) {
      const value = record[key];
      if (value !== undefined && value !== null) {
        const text = String(value).trim();
        if (text) {
          return text;
        }
      }
    }

    return null;
  }

  private pickAiAssistNullableNumber(record: Record<string, unknown>, keys: string[]) {
    for (const key of keys) {
      const value = record[key];
      if (value !== undefined && value !== null && value !== '') {
        const numberValue = Number(String(value).replace(/[$,]/g, '').trim());
        if (Number.isFinite(numberValue)) {
          return numberValue;
        }
      }
    }

    return null;
  }
}
