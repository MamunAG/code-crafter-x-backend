import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import axios from 'axios';
import { PDFParse } from 'pdf-parse';
import { Factory } from 'src/app-configuration/factory/entity/factory.entity';
import { PaginatedResponseDto } from 'src/common/dto/paginated-response.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { Buyer } from 'src/merchandising/buyer/entity/buyer.entity';
import { Color } from 'src/merchandising/master-data/color/entity/color.entity';
import { Size } from 'src/merchandising/master-data/size/entity/size.entity';
import { Style } from 'src/merchandising/style/entity/style.entity';
import { Employee } from 'src/hr-payroll/employee/entity/employee.entity';
import { Repository } from 'typeorm';
import * as XLSX from 'xlsx';
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

type JobAiAssistRow = {
  poNumber: string;
  styleNo: string;
  color: string;
  size: string;
  quantity: number;
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

    const job = this.jobRepository.create({
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

  async update(id: string, dto: UpdateJobDto, userId: string, organizationId: string) {
    const job = await this.jobRepository
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

    if (dto.factoryId !== undefined) {
      await this.findFactoryOrFail(dto.factoryId, organizationId);
      job.factoryId = dto.factoryId;
    }

    if (dto.buyerId !== undefined) {
      await this.findBuyerOrFail(dto.buyerId, organizationId);
      job.buyerId = dto.buyerId;
    }

    if (dto.merchandiserId != null) {
      await this.findEmployeeOrFail(dto.merchandiserId, organizationId);
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

  private parseBoolean(value: boolean | string | null | undefined) {
    if (typeof value === 'boolean') {
      return value;
    }

    return ['true', 'yes', 'y', '1', 'active'].includes(value?.trim().toLowerCase() ?? '');
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
      'Output shape must be exactly: {"rows":[{"poNumber":"","styleNo":"","color":"","size":"","quantity":0}]}',
      'Rules:',
      '1. Create one row per PO/style/color/size/quantity combination.',
      '2. If sizes are shown as columns (for example XS,S,M,L) with quantities under them, expand each non-zero size quantity into a separate row.',
      '3. If PO number, style no, or color appears once above multiple rows, carry that value forward until a new value is shown.',
      '4. Ignore totals, subtotals, grand totals, prices, FOB, CM, dates, buyer names, addresses, descriptions, and remarks.',
      '5. Do not guess missing values. Use an empty string for missing text fields and 0 only when quantity is unreadable.',
      '6. Quantity must be a number, not text. Remove commas from quantity values.',
      '7. Preserve PO number, style no, color, and size exactly as written except trim extra whitespace.',
      '8. If there are no valid detail rows, return {"rows":[]}.',
    ].join('\n');
    const userPrompt = [
      'Extract PO detail rows from the document text below.',
      'Required fields: poNumber, styleNo, color, size, quantity.',
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
      color: this.pickAiAssistString(record, ['color', 'colour', 'Color', 'Colour']),
      size: this.pickAiAssistString(record, ['size', 'Size']),
      quantity: this.pickAiAssistNumber(record, ['quantity', 'qty', 'Quantity', 'Qty']),
    };

    const hasAnyData = normalizedRow.poNumber || normalizedRow.styleNo || normalizedRow.color || normalizedRow.size || normalizedRow.quantity > 0;
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
}
