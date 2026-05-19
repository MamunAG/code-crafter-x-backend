import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import PDFDocument from 'pdfkit';
import { DataSource, EntityManager, In, Repository } from 'typeorm';
import { Organization } from 'src/app-configuration/organization/entity/organization.entity';
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

type PdfColumn = {
  label: string;
  width: number;
};

type PdfOrganizationHeader = {
  name: string;
  address?: string | null;
};

const PDF_MARGIN = 20;
const PDF_PAGE_HEIGHT = 595.28;
const PDF_FIXED_COLUMN_WIDTHS = {
  buyer: 58,
  job: 58,
  lead: 46,
};
const PDF_TASK_COLUMN_MIN_WIDTH = 86;
const PDF_TASK_COLUMN_MAX_WIDTH = 150;
const PDF_MIN_CONTENT_WIDTH = 680;

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

    if (filters?.leadTime !== undefined) {
      queryBuilder.andWhere('tna.lead_time = :leadTime', { leadTime: filters.leadTime });
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

  async findReport(filters?: TnaListFilters, organizationId?: string) {
    const queryBuilder = this.tnaRepository
      .createQueryBuilder('tna')
      .distinct(true)
      .leftJoinAndSelect('tna.buyer', 'buyer')
      .leftJoinAndSelect('tna.job', 'job')
      .leftJoinAndSelect('job.factory', 'factory')
      .leftJoinAndSelect('tna.tnaDetails', 'tnaDetails')
      .leftJoinAndSelect('tnaDetails.task', 'task')
      .leftJoinAndSelect('tnaDetails.revisions', 'revisions')
      .leftJoinAndSelect('tna.created_by_user', 'created_by_user')
      .where('factory.organization_id = :organizationId', { organizationId })
      .andWhere('tna.deleted_at IS NULL')
      .orderBy('buyer.displayName', 'ASC')
      .addOrderBy('buyer.name', 'ASC')
      .addOrderBy('job.jobNo', 'ASC')
      .addOrderBy('tna.created_at', 'DESC')
      .addOrderBy('tnaDetails.sortOrder', 'ASC')
      .addOrderBy('revisions.created_at', 'ASC');

    if (filters?.buyerId) {
      queryBuilder.andWhere('tna.buyer_id = :buyerId', { buyerId: filters.buyerId });
    }

    if (filters?.jobId) {
      queryBuilder.andWhere('tna.job_id = :jobId', { jobId: filters.jobId });
    }

    if (filters?.leadTime !== undefined) {
      queryBuilder.andWhere('tna.lead_time = :leadTime', { leadTime: filters.leadTime });
    }

    const items = await queryBuilder.getMany();
    items.forEach((item) => this.sortDetailsBySortOrder(item));

    return items;
  }

  async buildReportPdf(filters?: TnaListFilters, organizationId?: string) {
    const organization = await this.findOrganizationHeaderOrFail(organizationId);
    const records = await this.findReport(filters, organizationId);
    return this.renderReportPdf(records, organization);
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

  private renderReportPdf(records: Tna[], organization: PdfOrganizationHeader) {
    return new Promise<Buffer>((resolve, reject) => {
      const pageWidth = this.getReportPdfPageWidth(records);
      const doc = new PDFDocument({
        size: [pageWidth, PDF_PAGE_HEIGHT],
        margin: PDF_MARGIN,
        info: {
          Title: 'TNA Report',
          Creator: 'Code Crafter X',
        },
      });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      this.writeReportPdf(doc, records, organization);
      doc.end();
    });
  }

  private writeReportPdf(doc: PDFKit.PDFDocument, records: Tna[], organization: PdfOrganizationHeader) {
    this.writeReportHeader(doc, organization);

    if (!records.length) {
      doc.font('Helvetica').fontSize(10).fillColor('#475569').text('No TNA records are available for this report.');
      return;
    }

    for (const record of records) {
      this.writeRecordPdfTable(doc, record);
    }
  }

  private writeReportHeader(doc: PDFKit.PDFDocument, organization: PdfOrganizationHeader) {
    const contentWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const address = organization.address?.trim();

    doc
      .font('Helvetica-Bold')
      .fontSize(14)
      .fillColor('#000000')
      .text(organization.name, doc.page.margins.left, doc.y, {
        width: contentWidth,
        align: 'center',
      });

    if (address) {
      doc
        .moveDown(0.2)
        .font('Helvetica')
        .fontSize(8)
        .fillColor('#334155')
        .text(address, doc.page.margins.left, doc.y, {
          width: contentWidth,
          align: 'center',
        });
    }

    doc
      .moveDown(0.45)
      .font('Helvetica-Bold')
      .fontSize(10)
      .fillColor('#000000')
      .text('TNA Report', doc.page.margins.left, doc.y, {
        width: contentWidth,
        align: 'center',
      });

    doc.moveDown(0.45);
  }

  private writeRecordPdfTable(doc: PDFKit.PDFDocument, record: Tna) {
    const details = [...(record.tnaDetails ?? [])].sort((left, right) => {
      const sortDifference = this.numberOrDefault(left.sortOrder, 0) - this.numberOrDefault(right.sortOrder, 0);
      return sortDifference || left.id.localeCompare(right.id);
    });
    const columns = this.getRecordPdfColumns(details);
    const values = [
      this.getBuyerLabel(record),
      this.getJobLabel(record),
      String(Number(record.leadTime ?? 0)),
      ...details.map((detail) => this.getTaskPdfLines(detail)),
    ];
    const rowHeight = this.getPdfRowHeight(doc, columns, values);

    this.ensurePdfSpace(doc, 26 + rowHeight + 12);
    this.writePdfTable(doc, columns, values, rowHeight);
    doc.y += 12;
  }

  private writePdfTable(doc: PDFKit.PDFDocument, columns: PdfColumn[], values: Array<string | string[]>, rowHeight: number) {
    const startX = doc.page.margins.left;
    const headerY = doc.y;
    const headerHeight = 24;
    let currentX = startX;

    doc.lineWidth(0.5);

    for (const column of columns) {
      doc.rect(currentX, headerY, column.width, headerHeight).fillAndStroke('#e2e8f0', '#94a3b8');
      doc
        .font('Helvetica-Bold')
        .fontSize(8)
        .fillColor('#000000')
        .text(column.label, currentX + 4, headerY + 5, { width: column.width - 8, align: 'center' });
      currentX += column.width;
    }

    currentX = startX;
    const bodyY = headerY + headerHeight;

    for (const [index, column] of columns.entries()) {
      doc.rect(currentX, bodyY, column.width, rowHeight).fillAndStroke('#ffffff', '#94a3b8');
      this.writePdfCellValue(doc, values[index] || '-', currentX, bodyY, column.width, rowHeight, index < 3);
      currentX += column.width;
    }

    doc.y = bodyY + rowHeight;
  }

  private writePdfCellValue(
    doc: PDFKit.PDFDocument,
    value: string | string[],
    x: number,
    y: number,
    width: number,
    height: number,
    verticallyCenter: boolean,
  ) {
    const cellPadding = 6;

    if (Array.isArray(value)) {
      const lineHeight = 15;
      let lineY = y + 7;

      value.forEach((line, index) => {
        if (index > 0) {
          doc
            .moveTo(x + cellPadding, lineY - 3)
            .lineTo(x + width - cellPadding, lineY - 3)
            .strokeColor('#d5dee8')
            .stroke();
        }

        doc
          .font('Helvetica')
          .fontSize(8)
          .fillColor('#000000')
          .text(line || '-', x + cellPadding, lineY, {
            width: width - cellPadding * 2,
            align: 'left',
          });
        lineY += Math.max(lineHeight, doc.heightOfString(line || '-', { width: width - cellPadding * 2, align: 'left' }) + 4);
      });
      return;
    }

    doc.font('Helvetica').fontSize(8).fillColor('#000000');

    const textHeight = doc.heightOfString(value || '-', { width: width - cellPadding * 2, align: 'center' });
    const textY = verticallyCenter ? y + Math.max(7, (height - textHeight) / 2) : y + 7;

    doc.text(value || '-', x + cellPadding, textY, {
      width: width - cellPadding * 2,
      align: 'center',
    });
  }

  private getPdfRowHeight(doc: PDFKit.PDFDocument, columns: PdfColumn[], values: Array<string | string[]>) {
    const heights = values.map((value, index) => {
      if (Array.isArray(value)) {
        doc.font('Helvetica').fontSize(8);
        const lineHeights = value.map((line) => doc.heightOfString(line || '-', { width: columns[index].width - 12, align: 'left' }) + 4);
        return Math.max(30, lineHeights.reduce((total, height) => total + Math.max(15, height), 14));
      }

      doc.font('Helvetica').fontSize(8);
      return doc.heightOfString(value || '-', { width: columns[index].width - 12, align: 'center' }) + 14;
    });

    return Math.max(32, ...heights);
  }

  private ensurePdfSpace(doc: PDFKit.PDFDocument, requiredHeight: number) {
    if (doc.y + requiredHeight > doc.page.height - doc.page.margins.bottom) {
      doc.addPage();
    }
  }

  private getTaskPdfLines(detail: TnaDetail) {
    const revisions = [...(detail.revisions ?? [])].sort((left, right) => {
      const leftTime = left.created_at ? new Date(left.created_at).getTime() : 0;
      const rightTime = right.created_at ? new Date(right.created_at).getTime() : 0;
      return leftTime - rightTime;
    });
    const lines = [this.formatReportDate(detail.executionDate)];

    if (revisions.length) {
      lines.push(`${this.formatReportDate(revisions[0]?.previousExecutionDate)}: (Initial Date)`);
      lines.push(
        ...revisions.map((revision) => `${this.formatReportDate(revision.newExecutionDate)}: (${revision.note?.trim() || 'Revised Date'})`),
      );
    }

    return lines;
  }

  private getRecordPdfColumns(details: TnaDetail[]) {
    return [
      { label: 'Buyer', width: PDF_FIXED_COLUMN_WIDTHS.buyer },
      { label: 'Job', width: PDF_FIXED_COLUMN_WIDTHS.job },
      { label: 'Lead', width: PDF_FIXED_COLUMN_WIDTHS.lead },
      ...details.map((detail) => ({
        label: detail.task?.name?.trim() || detail.taskId || '-',
        width: this.getTaskColumnWidth(detail),
      })),
    ];
  }

  private getReportPdfPageWidth(records: Tna[]) {
    const fixedWidth = PDF_FIXED_COLUMN_WIDTHS.buyer + PDF_FIXED_COLUMN_WIDTHS.job + PDF_FIXED_COLUMN_WIDTHS.lead;
    const maxRecordWidth = records.reduce((currentMax, record) => {
      const details = [...(record.tnaDetails ?? [])].sort((left, right) => {
        const sortDifference = this.numberOrDefault(left.sortOrder, 0) - this.numberOrDefault(right.sortOrder, 0);
        return sortDifference || left.id.localeCompare(right.id);
      });
      const recordWidth = fixedWidth + details.reduce((total, detail) => total + this.getTaskColumnWidth(detail), 0);
      return Math.max(currentMax, recordWidth);
    }, fixedWidth + PDF_TASK_COLUMN_MIN_WIDTH);
    const contentWidth = Math.max(PDF_MIN_CONTENT_WIDTH, maxRecordWidth);

    return contentWidth + PDF_MARGIN * 2;
  }

  private getTaskColumnWidth(detail: TnaDetail) {
    const label = detail.task?.name?.trim() || detail.taskId || '-';
    const contentLines = this.getTaskPdfLines(detail);
    const longestContentLineLength = contentLines.reduce((maxLength, line) => Math.max(maxLength, line.length), 0);
    const estimatedWidth = Math.max(label.length * 5.2, longestContentLineLength * 3.9) + 18;

    return Math.max(PDF_TASK_COLUMN_MIN_WIDTH, Math.min(PDF_TASK_COLUMN_MAX_WIDTH, estimatedWidth));
  }

  private formatReportDate(value?: Date | string | null) {
    if (!value) {
      return '-';
    }

    const parsed = value instanceof Date ? value : new Date(value);

    if (Number.isNaN(parsed.getTime())) {
      return '-';
    }

    const day = parsed.getDate();
    const month = new Intl.DateTimeFormat('en-US', { month: 'short' }).format(parsed);
    const year = String(parsed.getFullYear()).slice(-2);
    return `${day}-${month}-${year}`;
  }

  private getBuyerLabel(record: Tna) {
    return record.buyer?.displayName?.trim() || record.buyer?.name?.trim() || record.buyerId || '-';
  }

  private getJobLabel(record: Tna) {
    return record.job?.jobNo?.trim() || record.jobId || '-';
  }

  private async findOrganizationHeaderOrFail(organizationId?: string) {
    if (!organizationId?.trim()) {
      throw new BadRequestException('An organization is required to export the TNA report.');
    }

    const organization = await this.dataSource.getRepository(Organization).findOne({
      where: { id: organizationId.trim() },
      select: {
        id: true,
        name: true,
        address: true,
      },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found.');
    }

    return {
      name: organization.name?.trim() || 'Organization',
      address: organization.address,
    };
  }
}
