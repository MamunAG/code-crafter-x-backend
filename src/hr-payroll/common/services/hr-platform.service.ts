import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  Optional,
  UnauthorizedException,
} from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { InjectRepository } from '@nestjs/typeorm';
import { randomBytes } from 'crypto';
import * as bcrypt from 'bcryptjs';
import { Brackets, DataSource, IsNull, Repository } from 'typeorm';
import type { Logger } from 'winston';
import { Employee } from '../../employee/entity/employee.entity';
import {
  AttendanceDay,
  AttendanceCorrection,
  AttendanceIntegrationCredential,
  AttendancePunch,
  EmployeeEmploymentHistory,
  EmployeeLoan,
  EmployeeSalaryAssignment,
  HrAuditEvent,
  HrMasterData,
  HrOrganizationSettings,
  LeaveBalance,
  LeaveRequest,
  LoanInstallment,
  OvertimeRequest,
  RosterAssignment,
  SalaryStructure,
  SalaryStructureComponent,
  Shift,
  StatutoryRulePack,
} from '../entity';
import {
  ApprovalStatus,
  AttendanceDirection,
  AttendanceStatus,
  EmployeeLifecycleAction,
  HrMasterDataType,
  LoanStatus,
} from '../hr.enums';
import {
  AssignSalaryDto,
  AttendanceDecisionDto,
  CreateAttendanceCorrectionDto,
  CreateIntegrationCredentialDto,
  CreateLeaveRequestDto,
  ManualAttendanceDto,
  CancelLeaveDto,
  CreateLoanDto,
  CreateMasterDataDto,
  CreateOvertimeRequestDto,
  CreateRosterDto,
  CreateRulePackDto,
  CreateSalaryStructureDto,
  CreateShiftDto,
  DeriveAttendanceDto,
  EmployeeLifecycleDto,
  IngestAttendanceDto,
  LeaveDecisionDto,
  LoanStatusDto,
  OvertimeDecisionDto,
  TenantPaginationDto,
  UpdateMasterDataDto,
  UpdateHrSettingsDto,
} from '../dto';
import { FormulaEngineService } from '../../payroll/formula-engine.service';
import { Factory } from 'src/app-configuration/factory/entity/factory.entity';
import {
  LeaveBalanceAdjustmentDto,
  LeaveQueryDto,
} from '../../leave/dto/leave-query.dto';
import {
  AuditCategory,
  AuditModuleName,
  AuditScheduleStatus,
  AuditStatus,
  type AuditEventInput,
} from '../../audit/audit.types';

const EXTERNAL_FORMULA_VARIABLES = [
  'BASE',
  'CALENDAR_DAYS',
  'WORKING_DAYS',
  'PAYABLE_DAYS',
  'PRESENT_DAYS',
  'ABSENT_DAYS',
  'UNPAID_LEAVE_DAYS',
  'OVERTIME_HOURS',
  'LATE_MINUTES',
  'LOAN_DEDUCTION',
  'ARREARS',
  'BONUS',
  'TAX_DEDUCTION',
  'PF_EMPLOYEE',
  'PF_EMPLOYER',
  'GRATUITY',
];

@Injectable()
export class HrAuditService {
  constructor(
    @InjectRepository(HrAuditEvent)
    private readonly repository: Repository<HrAuditEvent>,
    @Optional()
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger?: Logger,
  ) {}

  record(
    organizationId: string,
    actorId: string | null | undefined,
    action: string,
    subjectType: string,
    subjectId: string,
    beforeState?: unknown,
    afterState?: unknown,
    metadata: Record<string, unknown> = {},
  ) {
    return this.recordEvent({
      moduleName: AuditModuleName.HrPayroll,
      category: AuditCategory.Business,
      status: AuditStatus.Success,
      organizationId,
      actorId,
      action,
      subjectType,
      subjectId,
      beforeState: this.asRecord(beforeState),
      afterState: this.asRecord(afterState),
      metadata,
    });
  }

  recordEvent(event: AuditEventInput) {
    if (!this.logger)
      return this.repository
        .save(this.repository.create(event))
        .then(() => undefined);
    this.logger.log('info', 'audit_event', { auditEvent: event });
    return Promise.resolve();
  }

  async listRecent(
    organizationId: string,
    query: {
      page?: number;
      limit?: number;
      category?: AuditCategory;
      status?: AuditStatus;
      scheduleStatus?: AuditScheduleStatus;
      fromDate?: string;
      toDate?: string;
    } = {},
    moduleName: AuditModuleName | null = AuditModuleName.HrPayroll,
  ) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const base = this.repository
      .createQueryBuilder('event')
      .leftJoin('users', 'actor', 'actor.id = event.actor_id');
    if (moduleName) {
      base
        .where('event.module_name = :moduleName', { moduleName })
        .andWhere('event.organization_id = :organizationId', {
          organizationId,
        });
    } else {
      base.where('event.organization_id = :organizationId', {
        organizationId,
      });
    }
    if (query.category)
      base.andWhere('event.category = :category', { category: query.category });
    if (query.status)
      base.andWhere('event.status = :status', { status: query.status });
    if (query.scheduleStatus)
      base.andWhere('event.schedule_status = :scheduleStatus', {
        scheduleStatus: query.scheduleStatus,
      });
    if (query.fromDate)
      base.andWhere('event.created_at >= :fromDate', {
        fromDate: `${query.fromDate}T00:00:00.000Z`,
      });
    if (query.toDate) {
      const toDateExclusive = new Date(`${query.toDate}T00:00:00.000Z`);
      toDateExclusive.setUTCDate(toDateExclusive.getUTCDate() + 1);
      base.andWhere('event.created_at < :toDateExclusive', {
        toDateExclusive,
      });
    }
    const total = await base.getCount();
    const events = await base
      .clone()
      .select([
        'event.id AS "id"',
        'event.module_name AS "moduleName"',
        'event.category AS "category"',
        'event.status AS "status"',
        'event.organization_id AS "organizationId"',
        'event.actor_id AS "actorId"',
        'COALESCE(event.actor_name, actor.name, actor.email) AS "actorName"',
        'event.action AS "action"',
        'event.subject_type AS "subjectType"',
        'event.subject_id AS "subjectId"',
        'event.http_method AS "httpMethod"',
        'event.route AS "route"',
        'event.status_code AS "statusCode"',
        'event.request_id AS "requestId"',
        'event.duration_ms AS "durationMs"',
        'event.error_code AS "errorCode"',
        'event.error_message AS "errorMessage"',
        'event.client_ip AS "clientIp"',
        'event.user_agent AS "userAgent"',
        'event.job_name AS "jobName"',
        'event.schedule AS "schedule"',
        'event.run_id AS "runId"',
        'event.scheduled_for AS "scheduledFor"',
        'event.started_at AS "startedAt"',
        'event.completed_at AS "completedAt"',
        'event.schedule_status AS "scheduleStatus"',
        'event.metadata AS "metadata"',
        'event.created_at AS "createdAt"',
      ])
      .orderBy('event.created_at', 'DESC')
      .addOrderBy('event.id', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getRawMany<Record<string, unknown>>();
    const stats = await base
      .clone()
      .select('COUNT(*)', 'total')
      .addSelect(
        `COUNT(*) FILTER (WHERE event.category = 'CRON' AND event.status IN ('SUCCESS', 'ERROR', 'ABORTED'))`,
        'cronTotal',
      )
      .addSelect(
        `COUNT(*) FILTER (WHERE event.category = 'CRON' AND event.status = 'SUCCESS' AND event.schedule_status = 'ON_SCHEDULE')`,
        'cronOnSchedule',
      )
      .addSelect(
        `COUNT(*) FILTER (WHERE event.status != 'STARTED' AND (event.status IN ('ERROR', 'ABORTED') OR event.schedule_status IN ('DELAYED', 'MISSED', 'FAILED')))`,
        'issues',
      )
      .getRawOne<Record<string, string>>();
    return {
      generatedAt: new Date(),
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      stats: {
        total: Number(stats?.total ?? 0),
        cronTotal: Number(stats?.cronTotal ?? 0),
        cronOnSchedule: Number(stats?.cronOnSchedule ?? 0),
        issues: Number(stats?.issues ?? 0),
      },
      events,
    };
  }

  async deleteSelected(
    organizationId: string,
    ids: string[],
    moduleName: AuditModuleName | null = AuditModuleName.HrPayroll,
  ) {
    const deletion = this.repository
      .createQueryBuilder()
      .delete()
      .where('organization_id = :organizationId', { organizationId });
    if (moduleName) {
      deletion.andWhere('module_name = :moduleName', { moduleName });
    }
    const result = await deletion
      .andWhere('id IN (:...ids)', { ids })
      .execute();
    return { deleted: result.affected ?? 0 };
  }

  async deleteAll(
    organizationId: string,
    moduleName: AuditModuleName | null = AuditModuleName.HrPayroll,
  ) {
    const deletion = this.repository
      .createQueryBuilder()
      .delete()
      .where('organization_id = :organizationId', { organizationId });
    if (moduleName) {
      deletion.andWhere('module_name = :moduleName', { moduleName });
    }
    const result = await deletion.execute();
    return { deleted: result.affected ?? 0 };
  }

  private asRecord(value: unknown) {
    if (!value) return null;
    return JSON.parse(JSON.stringify(value)) as Record<string, unknown>;
  }
}

@Injectable()
export class HrMasterDataService {
  constructor(
    @InjectRepository(HrMasterData)
    private readonly repository: Repository<HrMasterData>,
    private readonly audit: HrAuditService,
  ) {}

  async list(
    organizationId: string,
    type: HrMasterDataType | undefined,
    query: TenantPaginationDto,
  ) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const qb = this.repository
      .createQueryBuilder('item')
      .where('item.organization_id = :organizationId', { organizationId })
      .orderBy('item.type', 'ASC')
      .addOrderBy('item.name', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);
    if (query.deletedOnly === 'true')
      qb.withDeleted().andWhere('item.deleted_at IS NOT NULL');
    else qb.andWhere('item.deleted_at IS NULL');
    if (type) qb.andWhere('item.type = :type', { type });
    if (query.search)
      qb.andWhere(
        '(item.code ILIKE :search OR item.name ILIKE :search OR item.name_bn ILIKE :search)',
        { search: `%${query.search}%` },
      );
    if (query.isActive !== undefined)
      qb.andWhere('item.is_active = :isActive', {
        isActive: query.isActive === 'true',
      });
    const [items, total] = await qb.getManyAndCount();
    return {
      items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPreviousPage: page > 1,
      },
    };
  }

  async create(
    organizationId: string,
    userId: string,
    dto: CreateMasterDataDto,
  ) {
    const settings = this.validateSettings(dto.type, dto.settings ?? {});
    const item = this.repository.create({
      ...dto,
      organizationId,
      code: dto.code.trim().toUpperCase(),
      name: dto.name.trim(),
      settings,
      isActive: dto.isActive ?? true,
      createdById: userId,
    });
    try {
      const saved = await this.repository.save(item);
      await this.audit.record(
        organizationId,
        userId,
        'CREATE',
        'HrMasterData',
        saved.id,
        null,
        saved,
      );
      return saved;
    } catch (error) {
      if ((error as { code?: string }).code === '23505')
        throw new ConflictException(
          'A master-data item with this type and code already exists.',
        );
      throw error;
    }
  }

  async update(
    organizationId: string,
    userId: string,
    id: string,
    dto: UpdateMasterDataDto,
  ) {
    const item = await this.findOne(organizationId, id);
    if (item.rowVersion !== dto.rowVersion)
      throw new ConflictException(
        'The record was changed by another user. Refresh and retry.',
      );
    const before = { ...item };
    const settings =
      dto.settings === undefined
        ? item.settings
        : this.validateSettings(item.type, dto.settings);
    Object.assign(item, dto, {
      name: dto.name?.trim() ?? item.name,
      nameBn:
        dto.nameBn === undefined ? item.nameBn : dto.nameBn.trim() || null,
      settings,
      updatedById: userId,
    });
    const saved = await this.repository.save(item);
    await this.audit.record(
      organizationId,
      userId,
      'UPDATE',
      'HrMasterData',
      id,
      before,
      saved,
    );
    return saved;
  }

  async findOne(
    organizationId: string,
    id: string,
    type?: HrMasterDataType,
    includeDeleted = false,
  ) {
    const qb = this.repository
      .createQueryBuilder('item')
      .where('item.id = :id', { id })
      .andWhere('item.organization_id = :organizationId', { organizationId });
    if (type) qb.andWhere('item.type = :type', { type });
    if (includeDeleted) qb.withDeleted();
    else qb.andWhere('item.deleted_at IS NULL');
    const item = await qb.getOne();
    if (!item) throw new NotFoundException('HR master-data item not found.');
    return item;
  }

  async createForType(
    organizationId: string,
    userId: string,
    type: HrMasterDataType,
    dto: Omit<CreateMasterDataDto, 'type'>,
  ) {
    const settings = this.validateSettings(type, dto.settings ?? {}, true);
    await this.ensureSettingsReferences(organizationId, type, settings);
    await this.ensureLeaveAssignmentPeriod(organizationId, type, settings);
    return this.create(organizationId, userId, { ...dto, type, settings });
  }

  async updateForType(
    organizationId: string,
    userId: string,
    type: HrMasterDataType,
    id: string,
    dto: UpdateMasterDataDto,
  ) {
    await this.findOne(organizationId, id, type);
    const settings =
      dto.settings === undefined
        ? undefined
        : this.validateSettings(type, dto.settings, true);
    if (settings)
      await this.ensureSettingsReferences(organizationId, type, settings);
    return this.update(organizationId, userId, id, { ...dto, settings });
  }

  async remove(
    organizationId: string,
    userId: string,
    type: HrMasterDataType,
    id: string,
  ) {
    const item = await this.findOne(organizationId, id, type);
    await this.repository.update(
      { id, organizationId, type },
      { deletedById: userId },
    );
    await this.repository.softDelete({ id, organizationId, type });
    await this.audit.record(
      organizationId,
      userId,
      'DELETE',
      'HrMasterData',
      id,
      item,
      null,
      { type },
    );
    return { id, deleted: true };
  }

  async restore(
    organizationId: string,
    userId: string,
    type: HrMasterDataType,
    id: string,
  ) {
    const item = await this.findOne(organizationId, id, type, true);
    if (!item.deletedAt)
      throw new BadRequestException('HR master-data item is not deleted.');
    await this.repository.restore({ id, organizationId, type });
    await this.repository.update(
      { id, organizationId, type },
      { deletedById: null, updatedById: userId },
    );
    const restored = await this.findOne(organizationId, id, type);
    await this.audit.record(
      organizationId,
      userId,
      'RESTORE',
      'HrMasterData',
      id,
      item,
      restored,
      { type },
    );
    return restored;
  }

  async permanentRemove(
    organizationId: string,
    userId: string,
    type: HrMasterDataType,
    id: string,
  ) {
    const item = await this.findOne(organizationId, id, type, true);
    if (!item.deletedAt)
      throw new BadRequestException(
        'Soft delete the item before deleting it permanently.',
      );
    await this.audit.record(
      organizationId,
      userId,
      'PERMANENT_DELETE',
      'HrMasterData',
      id,
      item,
      null,
      { type },
    );
    await this.repository.delete({ id, organizationId, type });
    return { id, permanentlyDeleted: true };
  }

  buildUploadTemplate(type: HrMasterDataType) {
    return [
      'code',
      'name',
      'nameBn',
      ...this.settingsFields(type),
      'isActive',
    ].join(',');
  }

  async importFromTemplate(
    organizationId: string,
    userId: string,
    type: HrMasterDataType,
    file?: Express.Multer.File,
  ) {
    if (!file?.buffer?.length)
      throw new BadRequestException('Please upload a CSV template file.');
    const lines = file.buffer
      .toString('utf8')
      .replace(/^\uFEFF/, '')
      .split(/\r?\n/)
      .filter((line) => line.trim());
    if (lines.length < 2) return { inserted: 0, skipped: 0, errors: [] };
    const headers = this.parseCsvLine(lines[0]).map((value) => value.trim());
    for (const required of ['code', 'name', 'isActive']) {
      if (!headers.includes(required))
        throw new BadRequestException(
          `The uploaded template must include the ${required} column.`,
        );
    }
    const settingFields = this.settingsFields(type);
    const errors: Array<{ row: number; message: string }> = [];
    let inserted = 0;
    let skipped = 0;
    const seen = new Set<string>();
    for (let index = 1; index < lines.length; index += 1) {
      const values = this.parseCsvLine(lines[index]);
      const row = Object.fromEntries(
        headers.map((header, column) => [header, values[column]?.trim() ?? '']),
      );
      const code = row.code?.toUpperCase();
      if (!code || !row.name) {
        errors.push({ row: index + 1, message: 'code and name are required.' });
        skipped += 1;
        continue;
      }
      if (seen.has(code)) {
        errors.push({
          row: index + 1,
          message: `Duplicate code ${code} in the file.`,
        });
        skipped += 1;
        continue;
      }
      seen.add(code);
      try {
        const exists = await this.repository
          .createQueryBuilder('item')
          .withDeleted()
          .where('item.organization_id = :organizationId', { organizationId })
          .andWhere('item.type = :type', { type })
          .andWhere('item.code = :code', { code })
          .getOne();
        if (exists) {
          errors.push({
            row: index + 1,
            message: `Code ${code} already exists.`,
          });
          skipped += 1;
          continue;
        }
        const settings = Object.fromEntries(
          settingFields
            .filter((field) => row[field] !== '')
            .map((field) => [field, this.parseCsvValue(row[field])]),
        );
        await this.createForType(organizationId, userId, type, {
          code,
          name: row.name,
          nameBn: row.nameBn || undefined,
          settings,
          isActive: this.parseBoolean(row.isActive),
        });
        inserted += 1;
      } catch (error) {
        errors.push({
          row: index + 1,
          message: error instanceof Error ? error.message : 'Invalid row.',
        });
        skipped += 1;
      }
    }
    await this.audit.record(
      organizationId,
      userId,
      'IMPORT',
      'HrMasterData',
      type,
      null,
      { inserted, skipped },
      { type, errors },
    );
    return { inserted, skipped, errors };
  }

  private settingsFields(type: HrMasterDataType) {
    const fields: Record<HrMasterDataType, string[]> = {
      [HrMasterDataType.EmploymentType]: [
        'employmentCategory',
        'defaultProbationDays',
        'overtimeEligible',
        'leaveEligible',
        'benefitsEligible',
      ],
      [HrMasterDataType.Grade]: ['rank', 'managementLevel', 'overtimeEligible'],
      [HrMasterDataType.PayGroup]: [
        'frequency',
        'cutoffRule',
        'paymentOffsetDays',
        'defaultWorkingDays',
      ],
      [HrMasterDataType.WorkLocation]: [
        'locationType',
        'factoryId',
        'address',
        'district',
        'timezone',
      ],
      [HrMasterDataType.HolidayCalendar]: [
        'year',
        'weeklyRestDays',
        'holidays',
      ],
      [HrMasterDataType.LeaveType]: [
        'description',
        'color',
        'sortOrder',
        'leaveClassification',
        'dayUnit',
        'hourlyAllowed',
        'countCalendarDays',
        'approvalLevels',
        'allowNegativeBalance',
        'accrualFrequency',
        'accrualRate',
        'carryForwardAllowed',
        'carryForwardCap',
        'expiryMonths',
        'encashable',
        'halfDayAllowed',
        'attachmentRequired',
        'documentationRequiredAfterDays',
        'noticePeriodDays',
        'maxConsecutiveDays',
      ],
      [HrMasterDataType.LeavePolicy]: [
        'effectiveFrom',
        'effectiveTo',
        'status',
        'rules',
      ],
      [HrMasterDataType.LeavePolicyAssignment]: [
        'employeeId',
        'policyId',
        'effectiveFrom',
        'effectiveTo',
        'active',
      ],
      [HrMasterDataType.LeaveWorkflow]: ['active', 'levels'],
      [HrMasterDataType.LeaveWorkflowAssignment]: [
        'targetType',
        'targetId',
        'workflowId',
        'effectiveFrom',
        'effectiveTo',
        'priority',
      ],
      [HrMasterDataType.SalaryComponent]: [
        'componentType',
        'calculationMethod',
        'formula',
        'taxable',
        'recurring',
        'prorated',
        'affectsGross',
        'roundingPrecision',
      ],
      [HrMasterDataType.SeparationReason]: [
        'separationCategory',
        'eligibleForRehire',
        'noticeRequired',
        'defaultNoticeDays',
      ],
    };
    return fields[type];
  }

  private validateSettings(
    type: HrMasterDataType,
    source: Record<string, unknown>,
    strict = false,
  ) {
    const allowed = new Set(this.settingsFields(type));
    if (type === HrMasterDataType.HolidayCalendar) allowed.add('dates');
    const unknown = Object.keys(source).filter((key) => !allowed.has(key));
    if (strict && unknown.length)
      throw new BadRequestException(
        `Unsupported settings for ${type}: ${unknown.join(', ')}.`,
      );
    const settings = { ...source };
    const required = (key: string) => {
      if (
        strict &&
        (settings[key] === undefined ||
          settings[key] === null ||
          settings[key] === '')
      )
        throw new BadRequestException(`${key} is required.`);
    };
    const enumValue = (key: string, values: string[]) => {
      if (
        settings[key] !== undefined &&
        !values.includes(this.scalarString(settings[key], key))
      )
        throw new BadRequestException(
          `${key} must be one of: ${values.join(', ')}.`,
        );
    };
    const integer = (
      key: string,
      minimum = 0,
      maximum = Number.MAX_SAFE_INTEGER,
    ) => {
      if (
        settings[key] !== undefined &&
        (!Number.isInteger(Number(settings[key])) ||
          Number(settings[key]) < minimum ||
          Number(settings[key]) > maximum)
      )
        throw new BadRequestException(
          `${key} must be an integer from ${minimum} to ${maximum}.`,
        );
      if (settings[key] !== undefined) settings[key] = Number(settings[key]);
    };
    const number = (key: string, minimum = 0) => {
      if (
        settings[key] !== undefined &&
        (!Number.isFinite(Number(settings[key])) ||
          Number(settings[key]) < minimum)
      )
        throw new BadRequestException(
          `${key} must be a number of at least ${minimum}.`,
        );
      if (settings[key] !== undefined) settings[key] = Number(settings[key]);
    };
    const boolean = (key: string) => {
      if (settings[key] !== undefined && typeof settings[key] !== 'boolean')
        throw new BadRequestException(`${key} must be boolean.`);
    };
    switch (type) {
      case HrMasterDataType.EmploymentType:
        required('employmentCategory');
        enumValue('employmentCategory', [
          'PERMANENT',
          'CONTRACT',
          'TEMPORARY',
          'PROBATION',
          'INTERN',
          'CASUAL',
        ]);
        integer('defaultProbationDays', 0, 730);
        ['overtimeEligible', 'leaveEligible', 'benefitsEligible'].forEach(
          boolean,
        );
        break;
      case HrMasterDataType.Grade:
        integer('rank', 1, 9999);
        ['overtimeEligible'].forEach(boolean);
        break;
      case HrMasterDataType.PayGroup:
        required('frequency');
        enumValue('frequency', [
          'WEEKLY',
          'BIWEEKLY',
          'SEMIMONTHLY',
          'MONTHLY',
        ]);
        integer('paymentOffsetDays', 0, 90);
        number('defaultWorkingDays', 0);
        break;
      case HrMasterDataType.WorkLocation:
        required('locationType');
        enumValue('locationType', [
          'FACTORY',
          'OFFICE',
          'WAREHOUSE',
          'REMOTE',
          'OTHER',
        ]);
        if (settings.timezone) {
          try {
            new Intl.DateTimeFormat('en-US', {
              timeZone: this.scalarString(settings.timezone, 'timezone'),
            }).format();
          } catch {
            throw new BadRequestException(
              'timezone must be a valid IANA timezone.',
            );
          }
        }
        break;
      case HrMasterDataType.HolidayCalendar: {
        required('year');
        integer('year', 2000, 2200);
        if (
          settings.weeklyRestDays !== undefined &&
          (!Array.isArray(settings.weeklyRestDays) ||
            settings.weeklyRestDays.some(
              (day) =>
                !Number.isInteger(Number(day)) ||
                Number(day) < 0 ||
                Number(day) > 6,
            ))
        )
          throw new BadRequestException(
            'weeklyRestDays must contain weekday numbers from 0 to 6.',
          );
        if (
          settings.holidays !== undefined &&
          !Array.isArray(settings.holidays)
        )
          throw new BadRequestException('holidays must be an array.');
        const holidays = settings.holidays as
          | Array<Record<string, unknown>>
          | undefined;
        if (holidays) {
          for (const holiday of holidays)
            if (
              typeof holiday.date !== 'string' ||
              !/^\d{4}-\d{2}-\d{2}$/.test(holiday.date) ||
              typeof holiday.name !== 'string' ||
              !holiday.name.trim()
            )
              throw new BadRequestException(
                'Each holiday requires a YYYY-MM-DD date and name.',
              );
          settings.dates = holidays.map((holiday) => holiday.date as string);
        }
        if (
          settings.dates !== undefined &&
          (!Array.isArray(settings.dates) ||
            settings.dates.some(
              (date) => !/^\d{4}-\d{2}-\d{2}$/.test(String(date)),
            ))
        )
          throw new BadRequestException(
            'dates must contain YYYY-MM-DD values.',
          );
        break;
      }
      case HrMasterDataType.LeaveType:
        required('leaveClassification');
        enumValue('leaveClassification', ['PAID', 'UNPAID']);
        enumValue('dayUnit', ['DAY', 'HOUR']);
        enumValue('accrualFrequency', [
          'NONE',
          'MONTHLY',
          'QUARTERLY',
          'YEARLY',
        ]);
        integer('approvalLevels', 1, 3);
        integer('expiryMonths', 0, 120);
        integer('sortOrder', 0, 9999);
        integer('noticePeriodDays', 0, 730);
        number('documentationRequiredAfterDays', 0);
        number('accrualRate', 0);
        number('carryForwardCap', 0);
        number('maxConsecutiveDays', 0);
        [
          'hourlyAllowed',
          'countCalendarDays',
          'allowNegativeBalance',
          'carryForwardAllowed',
          'encashable',
          'halfDayAllowed',
          'attachmentRequired',
        ].forEach(boolean);
        break;
      case HrMasterDataType.LeavePolicy:
        required('effectiveFrom');
        if (settings.rules !== undefined && !Array.isArray(settings.rules))
          throw new BadRequestException('rules must be an array.');
        break;
      case HrMasterDataType.LeavePolicyAssignment:
        required('employeeId');
        required('policyId');
        required('effectiveFrom');
        boolean('active');
        break;
      case HrMasterDataType.LeaveWorkflow:
        if (settings.levels !== undefined && !Array.isArray(settings.levels))
          throw new BadRequestException('levels must be an array.');
        if (Array.isArray(settings.levels)) {
          const levels = settings.levels as Array<Record<string, unknown>>;
          const numbers = levels.map((level) => Number(level.levelNumber));
          if (
            numbers.some((level) => !Number.isInteger(level) || level < 1) ||
            new Set(numbers).size !== numbers.length
          )
            throw new BadRequestException(
              'Workflow level numbers must be unique positive integers.',
            );
          const approverTypes = [
            'SPECIFIC_USER',
            'ROLE',
            'REPORTING_MANAGER',
            'DEPARTMENT_HEAD',
            'SECTION_HEAD',
            'HR',
            'DESIGNATION',
          ];
          for (const level of levels) {
            if (!approverTypes.includes(String(level.approverType)))
              throw new BadRequestException(
                'A workflow level contains an unsupported approver type.',
              );
            if (level.approverType === 'SPECIFIC_USER' && !level.userId)
              throw new BadRequestException(
                'Specific user levels require userId.',
              );
            if (level.approverType === 'ROLE' && !level.roleId)
              throw new BadRequestException('Role levels require roleId.');
            if (level.approverType === 'DESIGNATION' && !level.designationId)
              throw new BadRequestException(
                'Designation levels require designationId.',
              );
          }
        }
        boolean('active');
        break;
      case HrMasterDataType.LeaveWorkflowAssignment:
        required('targetType');
        required('workflowId');
        enumValue('targetType', [
          'COMPANY',
          'FACTORY',
          'DEPARTMENT',
          'SECTION',
          'DESIGNATION',
          'EMPLOYEE',
        ]);
        break;
      case HrMasterDataType.SalaryComponent:
        required('componentType');
        required('calculationMethod');
        enumValue('componentType', [
          'EARNING',
          'DEDUCTION',
          'EMPLOYER_CONTRIBUTION',
          'INFORMATIONAL',
        ]);
        enumValue('calculationMethod', ['FIXED', 'PERCENTAGE', 'FORMULA']);
        integer('roundingPrecision', 0, 4);
        ['taxable', 'recurring', 'prorated', 'affectsGross'].forEach(boolean);
        break;
      case HrMasterDataType.SeparationReason:
        required('separationCategory');
        enumValue('separationCategory', [
          'VOLUNTARY',
          'INVOLUNTARY',
          'RETIREMENT',
          'OTHER',
        ]);
        integer('defaultNoticeDays', 0, 730);
        ['eligibleForRehire', 'noticeRequired'].forEach(boolean);
        break;
    }
    return settings;
  }

  private parseBoolean(value: unknown) {
    if (typeof value === 'boolean') return value;
    if (typeof value !== 'string' && typeof value !== 'number') return false;
    return ['true', 'yes', 'y', '1', 'active'].includes(
      String(value).trim().toLowerCase(),
    );
  }

  private async ensureSettingsReferences(
    organizationId: string,
    type: HrMasterDataType,
    settings: Record<string, unknown>,
  ) {
    if (type !== HrMasterDataType.WorkLocation || !settings.factoryId) return;
    const factoryId = this.scalarString(settings.factoryId, 'factoryId');
    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        factoryId,
      )
    )
      throw new BadRequestException('factoryId must be a valid UUID.');
    const factory = await this.repository.manager
      .getRepository(Factory)
      .findOne({ where: { id: factoryId, organizationId, isActive: true } });
    if (!factory)
      throw new BadRequestException(
        'The selected factory is not active in this organization.',
      );
  }

  private async ensureLeaveAssignmentPeriod(
    organizationId: string,
    type: HrMasterDataType,
    settings: Record<string, unknown>,
  ) {
    if (
      ![
        HrMasterDataType.LeavePolicyAssignment,
        HrMasterDataType.LeaveWorkflowAssignment,
      ].includes(type)
    )
      return;
    const identityKey =
      type === HrMasterDataType.LeavePolicyAssignment
        ? 'employeeId'
        : 'targetId';
    const identity = String(
      settings[identityKey] ??
        (type === HrMasterDataType.LeaveWorkflowAssignment ? 'COMPANY' : ''),
    );
    const from = String(settings.effectiveFrom ?? '0001-01-01');
    const to = String(settings.effectiveTo ?? '9999-12-31');
    const overlap = await this.repository
      .createQueryBuilder('item')
      .where(
        'item.organization_id = :organizationId AND item.type = :type AND item.deleted_at IS NULL',
        { organizationId, type },
      )
      .andWhere(
        `COALESCE(item.settings ->> '${identityKey}', 'COMPANY') = :identity`,
        { identity },
      )
      .andWhere(
        `COALESCE(item.settings ->> 'effectiveFrom', '0001-01-01') <= :to AND COALESCE(item.settings ->> 'effectiveTo', '9999-12-31') >= :from`,
        { from, to },
      )
      .getOne();
    if (overlap)
      throw new ConflictException(
        'This assignment overlaps an existing effective period.',
      );
  }

  private scalarString(value: unknown, field: string) {
    if (
      typeof value !== 'string' &&
      typeof value !== 'number' &&
      typeof value !== 'boolean'
    )
      throw new BadRequestException(`${field} must be a scalar value.`);
    return String(value);
  }

  private parseCsvValue(value: string) {
    const trimmed = value.trim();
    if (/^(true|false)$/i.test(trimmed))
      return trimmed.toLowerCase() === 'true';
    if (/^-?\d+(\.\d+)?$/.test(trimmed)) return Number(trimmed);
    if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
      try {
        return JSON.parse(trimmed) as unknown;
      } catch {
        throw new BadRequestException(`Invalid JSON value: ${trimmed}`);
      }
    }
    return trimmed;
  }

  private parseCsvLine(line: string) {
    const values: string[] = [];
    let current = '';
    let quoted = false;
    for (let index = 0; index < line.length; index += 1) {
      const character = line[index];
      if (character === '"' && line[index + 1] === '"') {
        current += '"';
        index += 1;
      } else if (character === '"') quoted = !quoted;
      else if (character === ',' && !quoted) {
        values.push(current);
        current = '';
      } else current += character;
    }
    values.push(current);
    return values;
  }

  private paginate<T>(items: T[], total: number, page: number, limit: number) {
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
}

@Injectable()
export class WorkforceService {
  private readonly rateWindows = new Map<
    string,
    { minute: number; count: number }
  >();

  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Employee)
    private readonly employees: Repository<Employee>,
    @InjectRepository(EmployeeEmploymentHistory)
    private readonly histories: Repository<EmployeeEmploymentHistory>,
    @InjectRepository(Shift) private readonly shifts: Repository<Shift>,
    @InjectRepository(RosterAssignment)
    private readonly rosters: Repository<RosterAssignment>,
    @InjectRepository(AttendanceIntegrationCredential)
    private readonly credentials: Repository<AttendanceIntegrationCredential>,
    @InjectRepository(AttendancePunch)
    private readonly punches: Repository<AttendancePunch>,
    @InjectRepository(AttendanceDay)
    private readonly attendanceDays: Repository<AttendanceDay>,
    @InjectRepository(AttendanceCorrection)
    private readonly corrections: Repository<AttendanceCorrection>,
    @InjectRepository(OvertimeRequest)
    private readonly overtimeRequests: Repository<OvertimeRequest>,
    @InjectRepository(LeaveRequest)
    private readonly leaveRequests: Repository<LeaveRequest>,
    @InjectRepository(LeaveBalance)
    private readonly leaveBalances: Repository<LeaveBalance>,
    @InjectRepository(HrMasterData)
    private readonly masterData: Repository<HrMasterData>,
    @InjectRepository(HrOrganizationSettings)
    private readonly organizationSettings: Repository<HrOrganizationSettings>,
    private readonly audit: HrAuditService,
  ) {}

  async getSettings(organizationId: string) {
    return (
      (await this.organizationSettings.findOne({
        where: { organizationId },
      })) ??
      this.organizationSettings.create({
        organizationId,
        timezone: 'Asia/Dhaka',
        currency: 'BDT',
        leaveApprovalLevels: 1,
        attendanceRoundingMinutes: 1,
        settings: {},
      })
    );
  }

  async updateSettings(
    organizationId: string,
    userId: string,
    dto: UpdateHrSettingsDto,
  ) {
    let settings = await this.organizationSettings.findOne({
      where: { organizationId },
    });
    if (settings && dto.rowVersion && settings.rowVersion !== dto.rowVersion)
      throw new ConflictException('HR settings were changed by another user.');
    if (dto.timezone) {
      try {
        new Intl.DateTimeFormat('en-US', { timeZone: dto.timezone }).format();
      } catch {
        throw new BadRequestException('Invalid IANA timezone.');
      }
    }
    settings ??= this.organizationSettings.create({
      organizationId,
      timezone: 'Asia/Dhaka',
      currency: 'BDT',
      leaveApprovalLevels: 1,
      attendanceRoundingMinutes: 1,
      settings: {},
      createdById: userId,
    });
    const before = { ...settings };
    Object.assign(settings, dto, { updatedById: userId });
    const saved = await this.organizationSettings.save(settings);
    await this.audit.record(
      organizationId,
      userId,
      'UPDATE',
      'HrOrganizationSettings',
      saved.id,
      before,
      saved,
    );
    return saved;
  }

  async employeeHistory(organizationId: string, employeeId: string) {
    await this.requireEmployee(organizationId, employeeId);
    return this.histories.find({
      where: { organizationId, employeeId },
      order: { effectiveFrom: 'DESC' },
    });
  }

  async applyLifecycle(
    organizationId: string,
    userId: string,
    employeeId: string,
    dto: EmployeeLifecycleDto,
  ) {
    const employee = await this.requireEmployee(organizationId, employeeId);
    await this.validateLifecycleReferences(organizationId, dto);
    if (
      dto.effectiveFrom <
      String(employee.joiningDate ?? '0000-00-00').slice(0, 10)
    )
      throw new BadRequestException(
        'Lifecycle changes cannot predate the employee joining date.',
      );
    const current = await this.histories.findOne({
      where: { organizationId, employeeId, effectiveTo: IsNull() },
      order: { effectiveFrom: 'DESC' },
    });
    if (current && current.effectiveFrom >= dto.effectiveFrom)
      throw new ConflictException(
        'A current or future lifecycle record already covers this date.',
      );

    return this.dataSource.transaction(async (manager) => {
      if (current) {
        const previousDay = new Date(`${dto.effectiveFrom}T00:00:00Z`);
        previousDay.setUTCDate(previousDay.getUTCDate() - 1);
        current.effectiveTo = previousDay.toISOString().slice(0, 10);
        await manager.save(current);
      }
      const history = manager.create(EmployeeEmploymentHistory, {
        ...dto,
        organizationId,
        employeeId,
        createdById: userId,
      });
      const saved = await manager.save(history);
      Object.assign(employee, {
        factoryId: dto.factoryId ?? employee.factoryId,
        departmentId: dto.departmentId ?? employee.departmentId,
        designationId: dto.designationId ?? employee.designationId,
        supervisorId: dto.supervisorId ?? employee.supervisorId,
        gradeId: dto.gradeId ?? employee.gradeId,
        payGroupId: dto.payGroupId ?? employee.payGroupId,
        isActive: ![
          EmployeeLifecycleAction.Suspend,
          EmployeeLifecycleAction.Resign,
          EmployeeLifecycleAction.Terminate,
          EmployeeLifecycleAction.Retire,
        ].includes(dto.action),
        separationDate: [
          EmployeeLifecycleAction.Resign,
          EmployeeLifecycleAction.Terminate,
          EmployeeLifecycleAction.Retire,
        ].includes(dto.action)
          ? dto.effectiveFrom
          : employee.separationDate,
      });
      await manager.save(employee);
      await this.audit.record(
        organizationId,
        userId,
        dto.action,
        'Employee',
        employeeId,
        null,
        saved,
      );
      return saved;
    });
  }

  async createShift(
    organizationId: string,
    userId: string,
    dto: CreateShiftDto,
  ) {
    this.validateTime(dto.startTime);
    this.validateTime(dto.endTime);
    const entity = this.shifts.create({
      ...dto,
      organizationId,
      code: dto.code.trim().toUpperCase(),
      createdById: userId,
      isActive: true,
    });
    return this.shifts.save(entity);
  }

  listShifts(organizationId: string) {
    return this.shifts.find({
      where: { organizationId },
      order: { name: 'ASC' },
    });
  }

  async assignRoster(
    organizationId: string,
    userId: string,
    dto: CreateRosterDto,
  ) {
    await this.requireEmployee(organizationId, dto.employeeId);
    const shift = await this.shifts.findOne({
      where: { id: dto.shiftId, organizationId, isActive: true },
    });
    if (!shift) throw new NotFoundException('Active shift not found.');
    if (dto.effectiveTo && dto.effectiveTo < dto.effectiveFrom)
      throw new BadRequestException(
        'Roster end date cannot precede its start date.',
      );
    const overlap = await this.rosters
      .createQueryBuilder('roster')
      .where(
        'roster.organization_id = :organizationId AND roster.employee_id = :employeeId',
        { organizationId, employeeId: dto.employeeId },
      )
      .andWhere('roster.effective_from <= :endDate', {
        endDate: dto.effectiveTo ?? '9999-12-31',
      })
      .andWhere(
        '(roster.effective_to IS NULL OR roster.effective_to >= :startDate)',
        { startDate: dto.effectiveFrom },
      )
      .getOne();
    if (overlap)
      throw new ConflictException(
        'The employee already has a roster assignment overlapping this period.',
      );
    return this.rosters.save(
      this.rosters.create({
        ...dto,
        organizationId,
        createdById: userId,
        weeklyOffDays: dto.weeklyOffDays ?? [5],
      }),
    );
  }

  async createCredential(
    organizationId: string,
    userId: string,
    dto: CreateIntegrationCredentialDto,
  ) {
    const secret = `hrp_${randomBytes(32).toString('base64url')}`;
    const credential = this.credentials.create({
      organizationId,
      source: dto.source.trim().toUpperCase(),
      keyPrefix: secret.slice(0, 12),
      secretHash: await bcrypt.hash(secret, 12),
      allowedIps: dto.allowedIps ?? [],
      createdById: userId,
    });
    const saved = await this.credentials.save(credential);
    await this.audit.record(
      organizationId,
      userId,
      'CREATE_CREDENTIAL',
      'AttendanceIntegrationCredential',
      saved.id,
      null,
      { source: saved.source },
    );
    return {
      id: saved.id,
      source: saved.source,
      keyPrefix: saved.keyPrefix,
      secret,
    };
  }

  async revokeCredential(organizationId: string, userId: string, id: string) {
    const credential = await this.credentials.findOne({
      where: { id, organizationId },
    });
    if (!credential)
      throw new NotFoundException('Attendance credential not found.');
    credential.revokedAt = new Date();
    credential.updatedById = userId;
    await this.credentials.save(credential);
    await this.audit.record(
      organizationId,
      userId,
      'REVOKE_CREDENTIAL',
      'AttendanceIntegrationCredential',
      id,
    );
    return { revoked: true };
  }

  async authenticateIntegration(
    organizationId: string,
    source: string,
    secret: string | undefined,
    ip: string | undefined,
  ) {
    if (!secret)
      throw new UnauthorizedException(
        'Attendance integration key is required.',
      );
    const credential = await this.credentials.findOne({
      where: { organizationId, source: source.trim().toUpperCase() },
    });
    if (
      !credential ||
      credential.revokedAt ||
      !(await bcrypt.compare(secret, credential.secretHash))
    )
      throw new UnauthorizedException(
        'Invalid attendance integration credential.',
      );
    if (
      credential.allowedIps.length &&
      (!ip || !credential.allowedIps.includes(ip))
    )
      throw new ForbiddenException(
        'The source IP is not allowed for this credential.',
      );
    const minute = Math.floor(Date.now() / 60000);
    const rateKey = `${credential.id}:${minute}`;
    const current = this.rateWindows.get(rateKey) ?? { minute, count: 0 };
    if (current.count >= 120)
      throw new ForbiddenException('Attendance ingestion rate limit exceeded.');
    current.count += 1;
    this.rateWindows.set(rateKey, current);
    credential.lastUsedAt = new Date();
    await this.credentials.save(credential);
    return credential;
  }

  async ingest(organizationId: string, dto: IngestAttendanceDto) {
    const identifiers = dto.punches
      .filter((item) => item.employeeId)
      .map((item) => item.employeeId!);
    const codes = dto.punches
      .filter((item) => item.employeeCode)
      .map((item) => item.employeeCode!.trim().toUpperCase());
    if (!identifiers.length && !codes.length)
      return {
        inserted: 0,
        duplicates: 0,
        rejected: dto.punches.length,
        missingEmployees: ['Every punch requires employeeId or employeeCode.'],
      };
    const employees = await this.employees
      .createQueryBuilder('employee')
      .where('employee.organization_id = :organizationId', { organizationId })
      .andWhere(
        new Brackets((qb) => {
          if (identifiers.length)
            qb.where('employee.id IN (:...identifiers)', { identifiers });
          if (codes.length && identifiers.length)
            qb.orWhere('UPPER(TRIM(employee.employeeCode)) IN (:...codes)', {
              codes,
            });
          else if (codes.length)
            qb.where('UPPER(TRIM(employee.employeeCode)) IN (:...codes)', {
              codes,
            });
        }),
      )
      .getMany();
    const byId = new Map(employees.map((employee) => [employee.id, employee]));
    const byCode = new Map(
      employees.map((employee) => [
        employee.employeeCode.trim().toUpperCase(),
        employee,
      ]),
    );
    const missing: string[] = [];
    const entities = dto.punches.flatMap((item) => {
      const employee = item.employeeId
        ? byId.get(item.employeeId)
        : byCode.get(item.employeeCode?.trim().toUpperCase() ?? '');
      if (!employee) {
        missing.push(
          item.employeeId ?? item.employeeCode ?? item.externalEventId,
        );
        return [];
      }
      return [
        this.punches.create({
          organizationId,
          employeeId: employee.id,
          source: dto.source.trim().toUpperCase(),
          externalEventId: item.externalEventId,
          punchedAt: new Date(item.punchedAt),
          direction: item.direction ?? AttendanceDirection.Unknown,
          deviceIdentifier: item.deviceIdentifier,
          metadata: item.metadata ?? {},
        }),
      ];
    });
    let inserted = 0;
    let duplicates = 0;
    for (const chunk of this.chunk(entities, 250)) {
      const values = chunk.map((item) => ({
        organizationId: item.organizationId,
        employeeId: item.employeeId,
        source: item.source,
        externalEventId: item.externalEventId,
        punchedAt: item.punchedAt,
        direction: item.direction,
        deviceIdentifier: item.deviceIdentifier,
        metadata: item.metadata,
      }));
      const result = await this.punches
        .createQueryBuilder()
        .insert()
        .values(values as never[])
        .orIgnore()
        .execute();
      inserted += result.identifiers.length;
      duplicates += chunk.length - result.identifiers.length;
    }
    return {
      inserted,
      duplicates,
      rejected: missing.length,
      missingEmployees: [...new Set(missing)],
    };
  }

  async ingestManual(
    organizationId: string,
    userId: string,
    dto: ManualAttendanceDto,
  ) {
    const result = await this.ingest(organizationId, {
      source: `MANUAL:${userId}`,
      punches: dto.punches,
    });
    await this.audit.record(
      organizationId,
      userId,
      'MANUAL_PUNCH',
      'AttendancePunch',
      'BULK',
      null,
      result,
      { requested: dto.punches.length },
    );
    return result;
  }

  async deriveAttendance(
    organizationId: string,
    userId: string,
    dto: DeriveAttendanceDto,
  ) {
    const settings = await this.getSettings(organizationId);
    const dates = this.dateRange(dto.dateFrom, dto.dateTo, 31);
    const employeeWhere: Record<string, unknown> = {
      organizationId,
      isActive: true,
    };
    if (dto.employeeId) employeeWhere.id = dto.employeeId;
    const employees = await this.employees.find({ where: employeeWhere });
    const punchRows = await this.punches
      .createQueryBuilder('punch')
      .where('punch.organization_id = :organizationId', { organizationId })
      .andWhere('punch.punched_at >= :start AND punch.punched_at < :end', {
        start: `${this.previousDate(dto.dateFrom)}T00:00:00Z`,
        end: `${this.nextDate(this.nextDate(dto.dateTo))}T00:00:00Z`,
      })
      .andWhere(dto.employeeId ? 'punch.employee_id = :employeeId' : '1=1', {
        employeeId: dto.employeeId,
      })
      .orderBy('punch.punched_at', 'ASC')
      .getMany();
    const rosters = employees.length
      ? await this.rosters
          .createQueryBuilder('roster')
          .leftJoinAndSelect('roster.shift', 'shift')
          .where('roster.organization_id = :organizationId', { organizationId })
          .andWhere('roster.employee_id IN (:...employeeIds)', {
            employeeIds: employees.map((item) => item.id),
          })
          .andWhere(
            'roster.effective_from <= :dateTo AND (roster.effective_to IS NULL OR roster.effective_to >= :dateFrom)',
            { dateFrom: dto.dateFrom, dateTo: dto.dateTo },
          )
          .getMany()
      : [];
    const leaveRows = employees.length
      ? await this.leaveRequests
          .createQueryBuilder('leave')
          .where(
            'leave.organization_id = :organizationId AND leave.status = :status',
            { organizationId, status: ApprovalStatus.Approved },
          )
          .andWhere('leave.employee_id IN (:...employeeIds)', {
            employeeIds: employees.map((item) => item.id),
          })
          .andWhere(
            'leave.start_date <= :dateTo AND leave.end_date >= :dateFrom',
            { dateFrom: dto.dateFrom, dateTo: dto.dateTo },
          )
          .getMany()
      : [];
    const holidayCalendars = await this.masterData.find({
      where: {
        organizationId,
        type: HrMasterDataType.HolidayCalendar,
        isActive: true,
      },
    });
    const holidayDates = new Set(
      holidayCalendars.flatMap((calendar) =>
        Array.isArray(calendar.settings.dates)
          ? calendar.settings.dates.map(String)
          : [],
      ),
    );
    const results: AttendanceDay[] = [];
    for (const employee of employees)
      for (const workDate of dates) {
        const roster = rosters.find(
          (item) =>
            item.employeeId === employee.id &&
            item.effectiveFrom <= workDate &&
            (!item.effectiveTo || item.effectiveTo >= workDate),
        );
        const employeePunches = punchRows.filter(
          (item) => item.employeeId === employee.id,
        );
        const dailyPunches = roster?.shift
          ? this.punchesForShiftDay(
              employeePunches,
              workDate,
              roster.shift,
              settings.timezone,
            )
          : employeePunches.filter(
              (item) =>
                this.dateInTimezone(item.punchedAt, settings.timezone) ===
                workDate,
            );
        const leave = leaveRows.some(
          (item) =>
            item.employeeId === employee.id &&
            item.startDate <= workDate &&
            item.endDate >= workDate,
        );
        const weeklyOff =
          roster?.weeklyOffDays.includes(
            new Date(`${workDate}T00:00:00Z`).getUTCDay(),
          ) ?? false;
        const derived = this.deriveDay(
          workDate,
          dailyPunches,
          roster?.shift,
          leave,
          weeklyOff,
          holidayDates.has(workDate),
          settings.timezone,
          settings.attendanceRoundingMinutes,
          settings.overtimeCapMinutes,
        );
        const existing = await this.attendanceDays.findOne({
          where: { organizationId, employeeId: employee.id, workDate },
        });
        if (existing?.isFinalized) continue;
        results.push(
          this.attendanceDays.create({
            ...existing,
            ...derived,
            organizationId,
            employeeId: employee.id,
            workDate,
            shiftId: roster?.shiftId,
            isFinalized: dto.finalize ?? false,
            updatedById: userId,
            createdById: existing?.createdById ?? userId,
          }),
        );
      }
    await this.attendanceDays.save(results, { chunk: 250 });
    await this.audit.record(
      organizationId,
      userId,
      dto.finalize ? 'DERIVE_AND_FINALIZE' : 'DERIVE',
      'AttendanceDay',
      `${dto.dateFrom}:${dto.dateTo}`,
      null,
      { records: results.length },
    );
    return {
      processed: results.length,
      employees: employees.length,
      dates: dates.length,
      finalized: dto.finalize ?? false,
    };
  }

  async requestLeave(
    organizationId: string,
    userId: string,
    dto: CreateLeaveRequestDto,
  ) {
    await this.requireEmployee(organizationId, dto.employeeId);
    const leaveType = await this.masterData.findOne({
      where: {
        id: dto.leaveTypeId,
        organizationId,
        type: HrMasterDataType.LeaveType,
        isActive: true,
      },
    });
    if (!leaveType) throw new NotFoundException('Active leave type not found.');
    if (dto.endDate < dto.startDate)
      throw new BadRequestException(
        'Leave end date cannot precede the start date.',
      );
    const overlap = await this.leaveRequests
      .createQueryBuilder('leave')
      .where(
        'leave.organization_id = :organizationId AND leave.employee_id = :employeeId',
        { organizationId, employeeId: dto.employeeId },
      )
      .andWhere('leave.status IN (:...statuses)', {
        statuses: [ApprovalStatus.Pending, ApprovalStatus.Approved],
      })
      .andWhere(
        'leave.start_date <= :endDate AND leave.end_date >= :startDate',
        dto,
      )
      .getOne();
    if (overlap)
      throw new ConflictException(
        'This employee already has a leave request overlapping these dates.',
      );
    const preview = await this.previewLeave(organizationId, dto);
    const days = preview.chargeableDays;
    if (days <= 0)
      throw new BadRequestException(
        'The selected range contains no chargeable leave days.',
      );
    const settings = await this.getSettings(organizationId);
    const request = this.leaveRequests.create({
      ...dto,
      applicationNumber: `LV-${Date.now().toString(36).toUpperCase()}`,
      durationType:
        dto.durationType ?? (dto.isHalfDay ? 'FIRST_HALF' : 'FULL_DAY'),
      isHalfDay:
        dto.isHalfDay ??
        ['FIRST_HALF', 'SECOND_HALF'].includes(dto.durationType ?? ''),
      dayBreakdown: preview.dayBreakdown,
      days: String(days),
      organizationId,
      createdById: userId,
      status: ApprovalStatus.Pending,
      requiredApprovalLevels: Number(
        leaveType.settings.approvalLevels ?? settings.leaveApprovalLevels,
      ),
      approvalHistory: [
        {
          decision: 'SUBMITTED',
          actorId: userId,
          at: new Date().toISOString(),
        },
      ],
    });
    return this.leaveRequests.save(request);
  }

  async previewLeave(organizationId: string, dto: CreateLeaveRequestDto) {
    await this.requireEmployee(organizationId, dto.employeeId);
    const leaveType = await this.masterData.findOne({
      where: {
        id: dto.leaveTypeId,
        organizationId,
        type: HrMasterDataType.LeaveType,
        isActive: true,
      },
    });
    if (!leaveType) throw new NotFoundException('Active leave type not found.');
    if (dto.endDate < dto.startDate)
      throw new BadRequestException(
        'Leave end date cannot precede the start date.',
      );
    const dates = this.dateRange(dto.startDate, dto.endDate, 366);
    const roster = await this.rosters
      .createQueryBuilder('roster')
      .where(
        'roster.organization_id = :organizationId AND roster.employee_id = :employeeId',
        { organizationId, employeeId: dto.employeeId },
      )
      .andWhere(
        'roster.effective_from <= :endDate AND (roster.effective_to IS NULL OR roster.effective_to >= :startDate)',
        dto,
      )
      .orderBy('roster.effective_from', 'DESC')
      .getOne();
    const calendars = await this.masterData.find({
      where: {
        organizationId,
        type: HrMasterDataType.HolidayCalendar,
        isActive: true,
      },
    });
    const holidayRows = calendars.flatMap((calendar) =>
      Array.isArray(calendar.settings.holidays)
        ? calendar.settings.holidays
        : Array.isArray(calendar.settings.dates)
          ? calendar.settings.dates
          : [],
    );
    const holidayMap = new Map(
      holidayRows.map((row) =>
        typeof row === 'string'
          ? [row, 'Holiday']
          : [
              String((row as Record<string, unknown>).date),
              String((row as Record<string, unknown>).name ?? 'Holiday'),
            ],
      ),
    );
    const weeklyOffDays = roster?.weeklyOffDays ?? [5];
    const halfDay =
      dto.isHalfDay ||
      ['FIRST_HALF', 'SECOND_HALF'].includes(dto.durationType ?? '');
    const dayBreakdown = dates.map((date) => {
      const holiday = holidayMap.get(date);
      const weeklyOff = weeklyOffDays.includes(
        new Date(`${date}T00:00:00Z`).getUTCDay(),
      );
      const dayType = holiday
        ? 'HOLIDAY'
        : weeklyOff
          ? 'WEEKLY_OFF'
          : 'WORKING_DAY';
      const chargedDays =
        leaveType.settings.countCalendarDays || dayType === 'WORKING_DAY'
          ? halfDay
            ? 0.5
            : 1
          : 0;
      return {
        date,
        dayType,
        label: holiday ?? null,
        duration: chargedDays
          ? (dto.durationType ?? (halfDay ? 'FIRST_HALF' : 'FULL_DAY'))
          : null,
        chargedDays,
      };
    });
    const chargeableDays = dayBreakdown.reduce(
      (sum, row) => sum + row.chargedDays,
      0,
    );
    if (chargeableDays <= 0)
      throw new BadRequestException(
        'The selected range contains no chargeable leave days.',
      );
    const year = Number(dto.startDate.slice(0, 4));
    const balance = await this.leaveBalances.findOne({
      where: {
        organizationId,
        employeeId: dto.employeeId,
        leaveTypeId: dto.leaveTypeId,
        periodYear: year,
      },
    });
    const currentBalance = balance ? this.availableBalance(balance) : 0;
    const maxDays = Number(leaveType.settings.maxConsecutiveDays ?? 0);
    if (maxDays > 0 && chargeableDays > maxDays)
      throw new BadRequestException(
        `This leave type allows a maximum of ${maxDays} consecutive days.`,
      );
    if (leaveType.settings.attachmentRequired && !dto.attachmentUrl)
      throw new BadRequestException(
        'An attachment is required for this leave type.',
      );
    if (
      !leaveType.settings.allowNegativeBalance &&
      currentBalance < chargeableDays
    )
      throw new BadRequestException(
        `Insufficient leave balance. ${currentBalance} days are available.`,
      );
    return {
      currentBalance,
      calendarDays: dates.length,
      weeklyOffDays: dayBreakdown.filter((row) => row.dayType === 'WEEKLY_OFF')
        .length,
      holidays: dayBreakdown.filter((row) => row.dayType === 'HOLIDAY').length,
      chargeableDays,
      balanceAfterApproval: currentBalance - chargeableDays,
      dayBreakdown,
      policy: { ...leaveType.settings, leaveTypeName: leaveType.name },
    };
  }

  async decideLeave(
    organizationId: string,
    userId: string,
    id: string,
    dto: LeaveDecisionDto,
  ) {
    if (
      ![
        ApprovalStatus.Approved,
        ApprovalStatus.Rejected,
        ApprovalStatus.Returned,
      ].includes(dto.decision)
    )
      throw new BadRequestException(
        'Decision must be APPROVED, REJECTED, or RETURNED.',
      );
    const request = await this.leaveRequests.findOne({
      where: { id, organizationId },
    });
    if (!request) throw new NotFoundException('Leave request not found.');
    if (request.rowVersion !== dto.rowVersion)
      throw new ConflictException(
        'The leave request was changed by another user.',
      );
    if (request.status !== ApprovalStatus.Pending)
      throw new ConflictException(
        'Only pending leave requests can be decided.',
      );
    if (request.createdById === userId)
      throw new ForbiddenException(
        'You cannot approve your own leave request.',
      );
    if (
      [ApprovalStatus.Rejected, ApprovalStatus.Returned].includes(
        dto.decision,
      ) &&
      !dto.comment?.trim()
    )
      throw new BadRequestException(
        'A comment is required when rejecting or returning leave.',
      );
    const historyEntry = {
      level: request.approvalLevel + 1,
      decision: dto.decision,
      actorId: userId,
      comment: dto.comment ?? null,
      at: new Date().toISOString(),
    };
    request.approvalHistory = [...request.approvalHistory, historyEntry];
    if (
      [ApprovalStatus.Rejected, ApprovalStatus.Returned].includes(dto.decision)
    )
      request.status = dto.decision;
    else {
      request.approvalLevel += 1;
      if (request.approvalLevel >= request.requiredApprovalLevels)
        request.status = ApprovalStatus.Approved;
    }
    const saved = await this.leaveRequests.save(request);
    if (saved.status === ApprovalStatus.Approved)
      await this.consumeLeaveBalance(saved, userId);
    await this.audit.record(
      organizationId,
      userId,
      `LEAVE_${dto.decision}`,
      'LeaveRequest',
      id,
      null,
      saved,
      { comment: dto.comment ?? null },
    );
    return saved;
  }

  async cancelLeave(
    organizationId: string,
    userId: string,
    id: string,
    dto: CancelLeaveDto,
  ) {
    const request = await this.leaveRequests.findOne({
      where: { id, organizationId },
    });
    if (!request) throw new NotFoundException('Leave request not found.');
    if (request.rowVersion !== dto.rowVersion)
      throw new ConflictException(
        'The leave request was changed by another user.',
      );
    if (
      ![ApprovalStatus.Pending, ApprovalStatus.Approved].includes(
        request.status,
      )
    )
      throw new ConflictException(
        'Only pending or approved leave requests can be cancelled.',
      );
    const before = { ...request };
    if (request.status === ApprovalStatus.Approved)
      await this.restoreLeaveBalance(request, userId);
    request.status = ApprovalStatus.Cancelled;
    request.approvalHistory = [
      ...request.approvalHistory,
      {
        decision: ApprovalStatus.Cancelled,
        actorId: userId,
        comment: dto.comment ?? null,
        at: new Date().toISOString(),
      },
    ];
    const saved = await this.leaveRequests.save(request);
    await this.audit.record(
      organizationId,
      userId,
      'LEAVE_CANCELLED',
      'LeaveRequest',
      id,
      before,
      saved,
      { comment: dto.comment ?? null },
    );
    return saved;
  }

  async listLeave(
    organizationId: string,
    query: LeaveQueryDto,
    userId?: string,
    scope: 'all' | 'mine' | 'inbox' = 'all',
  ) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const qb = this.leaveRequests
      .createQueryBuilder('request')
      .where('request.organization_id = :organizationId', { organizationId })
      .orderBy('request.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);
    if (scope === 'mine')
      qb.andWhere('request.created_by_id = :userId', { userId });
    if (scope === 'inbox')
      qb.andWhere(
        'request.status = :pending AND request.created_by_id IS DISTINCT FROM :userId',
        { pending: ApprovalStatus.Pending, userId },
      );
    if (query.search)
      qb.andWhere(
        '(request.application_number ILIKE :search OR request.reason ILIKE :search)',
        { search: `%${query.search}%` },
      );
    if (query.employeeId)
      qb.andWhere('request.employee_id = :employeeId', query);
    if (query.leaveTypeId)
      qb.andWhere('request.leave_type_id = :leaveTypeId', query);
    if (query.status) qb.andWhere('request.status = :status', query);
    if (query.fromDate) qb.andWhere('request.end_date >= :fromDate', query);
    if (query.toDate) qb.andWhere('request.start_date <= :toDate', query);
    const [items, total] = await qb.getManyAndCount();
    return {
      items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPreviousPage: page > 1,
      },
    };
  }

  async leaveDetails(organizationId: string, id: string) {
    const request = await this.leaveRequests.findOne({
      where: { id, organizationId },
    });
    if (!request) throw new NotFoundException('Leave request not found.');
    const [employee, leaveType, balance] = await Promise.all([
      this.employees.findOne({
        where: { id: request.employeeId, organizationId },
        relations: { factory: true, designation: true, department: true },
      }),
      this.masterData.findOne({
        where: { id: request.leaveTypeId, organizationId },
      }),
      this.leaveBalances.findOne({
        where: {
          organizationId,
          employeeId: request.employeeId,
          leaveTypeId: request.leaveTypeId,
          periodYear: Number(request.startDate.slice(0, 4)),
        },
      }),
    ]);
    return {
      ...request,
      employee,
      leaveType,
      currentBalance: balance ? this.availableBalance(balance) : 0,
    };
  }

  async leaveDashboard(
    organizationId: string,
    userId: string,
    userEmail?: string,
  ) {
    const ownEmployee = userEmail
      ? await this.employees.findOne({
          where: { organizationId, email: userEmail },
        })
      : null;
    const requests = await this.leaveRequests.find({
      where: ownEmployee
        ? { organizationId, employeeId: ownEmployee.id }
        : { organizationId, createdById: userId },
      order: { createdAt: 'DESC' },
      take: 10,
    });
    const resolvedEmployeeId = ownEmployee?.id ?? requests[0]?.employeeId;
    const balances = resolvedEmployeeId
      ? await this.leaveBalances.find({
          where: {
            organizationId,
            employeeId: resolvedEmployeeId,
            periodYear: new Date().getFullYear(),
          },
        })
      : [];
    const types = await this.masterData.find({
      where: {
        organizationId,
        type: HrMasterDataType.LeaveType,
        isActive: true,
      },
    });
    return {
      balances: types.map((type) => {
        const balance = balances.find((item) => item.leaveTypeId === type.id);
        const pending = requests
          .filter(
            (item) =>
              item.leaveTypeId === type.id &&
              item.status === ApprovalStatus.Pending,
          )
          .reduce((sum, item) => sum + Number(item.days), 0);
        return {
          leaveTypeId: type.id,
          leaveTypeName: type.name,
          color: type.settings.color,
          opening: Number(balance?.opening ?? 0),
          accrued: Number(balance?.accrued ?? 0),
          adjusted: Number(balance?.adjusted ?? 0),
          carriedForward: Number(balance?.carriedForward ?? 0),
          used: Number(balance?.used ?? 0),
          encashed: Number(balance?.encashed ?? 0),
          expired: Number(balance?.expired ?? 0),
          available: balance ? this.availableBalance(balance) : 0,
          pending,
        };
      }),
      recentApplications: requests,
      upcomingLeave: requests.filter(
        (item) =>
          item.status === ApprovalStatus.Approved &&
          item.endDate >= new Date().toISOString().slice(0, 10),
      ),
      returned: requests.filter(
        (item) => item.status === ApprovalStatus.Returned,
      ),
    };
  }

  async leaveBalancesFor(
    organizationId: string,
    employeeId: string,
    year = new Date().getFullYear(),
  ) {
    await this.requireEmployee(organizationId, employeeId);
    const [balances, types] = await Promise.all([
      this.leaveBalances.find({
        where: { organizationId, employeeId, periodYear: year },
      }),
      this.masterData.find({
        where: { organizationId, type: HrMasterDataType.LeaveType },
      }),
    ]);
    return balances.map((balance) => ({
      ...balance,
      leaveType: types.find((type) => type.id === balance.leaveTypeId),
      available: this.availableBalance(balance),
    }));
  }

  async assertLeaveEmployeeAccess(
    organizationId: string,
    employeeId: string,
    email: string,
  ) {
    const employee = await this.employees.findOne({
      where: { id: employeeId, organizationId, email },
    });
    if (!employee)
      throw new ForbiddenException(
        'You can only access leave data linked to your employee profile.',
      );
  }

  async leaveLedger(
    organizationId: string,
    employeeId: string,
    query: LeaveQueryDto,
  ) {
    const result = await this.listLeave(
      organizationId,
      { ...query, employeeId },
      undefined,
      'all',
    );
    return {
      ...result,
      items: result.items
        .filter((item) =>
          [ApprovalStatus.Approved, ApprovalStatus.Cancelled].includes(
            item.status,
          ),
        )
        .map((item) => ({
          id: item.id,
          date: item.updatedAt,
          leaveTypeId: item.leaveTypeId,
          transactionType:
            item.status === ApprovalStatus.Cancelled ? 'CANCELLATION' : 'USAGE',
          reference: item.applicationNumber ?? item.id,
          credit:
            item.status === ApprovalStatus.Cancelled ? Number(item.days) : 0,
          debit:
            item.status === ApprovalStatus.Approved ? Number(item.days) : 0,
          description: item.reason,
        })),
    };
  }

  async adjustLeaveBalance(
    organizationId: string,
    userId: string,
    dto: LeaveBalanceAdjustmentDto,
  ) {
    await this.requireEmployee(organizationId, dto.employeeId);
    const year = Number(dto.effectiveDate.slice(0, 4));
    let balance = await this.leaveBalances.findOne({
      where: {
        organizationId,
        employeeId: dto.employeeId,
        leaveTypeId: dto.leaveTypeId,
        periodYear: year,
      },
    });
    if (!balance)
      balance = this.leaveBalances.create({
        organizationId,
        employeeId: dto.employeeId,
        leaveTypeId: dto.leaveTypeId,
        periodYear: year,
        opening: '0',
        accrued: '0',
        adjusted: '0',
        carriedForward: '0',
        used: '0',
        encashed: '0',
        expired: '0',
        createdById: userId,
      });
    const previousBalance = this.availableBalance(balance);
    balance.adjusted = String(Number(balance.adjusted) + dto.amount);
    balance.updatedById = userId;
    const saved = await this.leaveBalances.save(balance);
    await this.audit.record(
      organizationId,
      userId,
      'LEAVE_BALANCE_ADJUSTED',
      'LeaveBalance',
      saved.id,
      null,
      saved,
      {
        amount: dto.amount,
        reason: dto.reason,
        reference: dto.reference,
        effectiveDate: dto.effectiveDate,
      },
    );
    return {
      ...saved,
      previousBalance,
      adjustment: dto.amount,
      available: this.availableBalance(saved),
    };
  }

  async resubmitLeave(organizationId: string, userId: string, id: string) {
    const request = await this.leaveRequests.findOne({
      where: { id, organizationId, createdById: userId },
    });
    if (!request) throw new NotFoundException('Leave request not found.');
    if (request.status !== ApprovalStatus.Returned)
      throw new ConflictException(
        'Only returned leave requests can be resubmitted.',
      );
    request.status = ApprovalStatus.Pending;
    request.approvalHistory = [
      ...request.approvalHistory,
      {
        decision: 'RESUBMITTED',
        actorId: userId,
        at: new Date().toISOString(),
      },
    ];
    request.updatedById = userId;
    return this.leaveRequests.save(request);
  }

  async requestAttendanceCorrection(
    organizationId: string,
    userId: string,
    dto: CreateAttendanceCorrectionDto,
  ) {
    const day = await this.attendanceDays.findOne({
      where: { id: dto.attendanceDayId, organizationId },
    });
    if (!day) throw new NotFoundException('Attendance day not found.');
    if (!day.isFinalized)
      throw new BadRequestException(
        'Only finalized attendance requires a correction request. Re-derive an open day instead.',
      );
    const pending = await this.corrections.findOne({
      where: {
        organizationId,
        attendanceDayId: day.id,
        status: ApprovalStatus.Pending,
      },
    });
    if (pending)
      throw new ConflictException(
        'A correction is already pending for this attendance day.',
      );
    return this.corrections.save(
      this.corrections.create({
        ...dto,
        organizationId,
        createdById: userId,
        status: ApprovalStatus.Pending,
      }),
    );
  }

  async decideAttendanceCorrection(
    organizationId: string,
    userId: string,
    id: string,
    dto: AttendanceDecisionDto,
  ) {
    const correction = await this.corrections.findOne({
      where: { id, organizationId },
    });
    if (!correction)
      throw new NotFoundException('Attendance correction not found.');
    if (
      correction.rowVersion !== dto.rowVersion ||
      correction.status !== ApprovalStatus.Pending
    )
      throw new ConflictException(
        'The correction is stale or is no longer pending.',
      );
    if (correction.createdById === userId)
      throw new ForbiddenException(
        'The correction requester cannot approve the same correction.',
      );
    correction.status = dto.decision;
    correction.decidedById = userId;
    correction.decidedAt = new Date();
    correction.decisionComment = dto.comment;
    correction.updatedById = userId;
    if (dto.decision === ApprovalStatus.Approved) {
      const day = await this.attendanceDays.findOne({
        where: { id: correction.attendanceDayId, organizationId },
      });
      if (!day) throw new NotFoundException('Attendance day not found.');
      const before = { ...day };
      const allowed = [
        'status',
        'firstIn',
        'lastOut',
        'workedMinutes',
        'lateMinutes',
        'earlyExitMinutes',
        'overtimeMinutes',
      ] as const;
      for (const field of allowed)
        if (field in correction.requestedValues)
          (day as unknown as Record<string, unknown>)[field] =
            correction.requestedValues[field];
      day.calculationTrace = {
        ...day.calculationTrace,
        correctionId: correction.id,
        original: before,
        correctedAt: new Date().toISOString(),
      };
      await this.attendanceDays.save(day);
      await this.audit.record(
        organizationId,
        userId,
        'ATTENDANCE_CORRECT',
        'AttendanceDay',
        day.id,
        before,
        day,
      );
    }
    return this.corrections.save(correction);
  }

  async requestOvertime(
    organizationId: string,
    userId: string,
    dto: CreateOvertimeRequestDto,
  ) {
    await this.requireEmployee(organizationId, dto.employeeId);
    const day = await this.attendanceDays.findOne({
      where: {
        organizationId,
        employeeId: dto.employeeId,
        workDate: dto.workDate,
      },
    });
    if (!day || day.status !== AttendanceStatus.Present)
      throw new BadRequestException(
        'Overtime requires a present attendance day.',
      );
    return this.overtimeRequests.save(
      this.overtimeRequests.create({
        ...dto,
        organizationId,
        createdById: userId,
        status: ApprovalStatus.Pending,
      }),
    );
  }

  async decideOvertime(
    organizationId: string,
    userId: string,
    id: string,
    dto: OvertimeDecisionDto,
  ) {
    const request = await this.overtimeRequests.findOne({
      where: { id, organizationId },
    });
    if (!request) throw new NotFoundException('Overtime request not found.');
    if (
      request.rowVersion !== dto.rowVersion ||
      request.status !== ApprovalStatus.Pending
    )
      throw new ConflictException(
        'The overtime request is stale or no longer pending.',
      );
    if (request.createdById === userId)
      throw new ForbiddenException(
        'The overtime requester cannot approve the same request.',
      );
    const settings = await this.getSettings(organizationId);
    request.status = dto.decision;
    request.decidedById = userId;
    request.decidedAt = new Date();
    request.updatedById = userId;
    if (dto.decision === ApprovalStatus.Approved) {
      request.approvedMinutes = Math.min(
        dto.approvedMinutes ?? request.requestedMinutes,
        request.requestedMinutes,
        settings.overtimeCapMinutes ?? Number.MAX_SAFE_INTEGER,
      );
      const day = await this.attendanceDays.findOne({
        where: {
          organizationId,
          employeeId: request.employeeId,
          workDate: request.workDate,
        },
      });
      if (day) {
        day.overtimeMinutes = request.approvedMinutes;
        await this.attendanceDays.save(day);
      }
    }
    const saved = await this.overtimeRequests.save(request);
    await this.audit.record(
      organizationId,
      userId,
      `OVERTIME_${dto.decision}`,
      'OvertimeRequest',
      id,
      null,
      saved,
    );
    return saved;
  }

  private async consumeLeaveBalance(request: LeaveRequest, userId: string) {
    const year = Number(request.startDate.slice(0, 4));
    let balance = await this.leaveBalances.findOne({
      where: {
        organizationId: request.organizationId,
        employeeId: request.employeeId,
        leaveTypeId: request.leaveTypeId,
        periodYear: year,
      },
    });
    if (!balance)
      balance = this.leaveBalances.create({
        organizationId: request.organizationId,
        employeeId: request.employeeId,
        leaveTypeId: request.leaveTypeId,
        periodYear: year,
        opening: '0',
        accrued: '0',
        used: '0',
        adjusted: '0',
        carriedForward: '0',
        encashed: '0',
        expired: '0',
        createdById: userId,
      });
    const available = this.availableBalance(balance);
    const leaveType = await this.masterData.findOne({
      where: {
        id: request.leaveTypeId,
        organizationId: request.organizationId,
      },
    });
    if (
      available < Number(request.days) &&
      !leaveType?.settings.allowNegativeBalance
    )
      throw new ConflictException(
        'Insufficient leave balance. Approval was not applied.',
      );
    balance.used = String(Number(balance.used) + Number(request.days));
    await this.leaveBalances.save(balance);
  }

  private async restoreLeaveBalance(request: LeaveRequest, userId: string) {
    const year = Number(request.startDate.slice(0, 4));
    const balance = await this.leaveBalances.findOne({
      where: {
        organizationId: request.organizationId,
        employeeId: request.employeeId,
        leaveTypeId: request.leaveTypeId,
        periodYear: year,
      },
    });
    if (!balance || Number(balance.used) < Number(request.days))
      throw new ConflictException(
        'The approved leave balance cannot be reconciled for cancellation.',
      );
    balance.used = String(Number(balance.used) - Number(request.days));
    balance.updatedById = userId;
    await this.leaveBalances.save(balance);
  }

  private availableBalance(balance: LeaveBalance) {
    return (
      Number(balance.opening) +
      Number(balance.accrued) +
      Number(balance.adjusted) +
      Number(balance.carriedForward ?? 0) -
      Number(balance.used) -
      Number(balance.encashed) -
      Number(balance.expired ?? 0)
    );
  }

  private deriveDay(
    workDate: string,
    punches: AttendancePunch[],
    shift: Shift | undefined,
    leave: boolean,
    weeklyOff: boolean,
    holiday: boolean,
    timezone: string,
    roundingMinutes: number,
    overtimeCap?: number | null,
  ) {
    if (holiday)
      return {
        status: AttendanceStatus.Holiday,
        workedMinutes: 0,
        lateMinutes: 0,
        earlyExitMinutes: 0,
        overtimeMinutes: 0,
        calculationTrace: { reason: 'holiday' },
      };
    if (leave)
      return {
        status: AttendanceStatus.Leave,
        workedMinutes: 0,
        lateMinutes: 0,
        earlyExitMinutes: 0,
        overtimeMinutes: 0,
        calculationTrace: { reason: 'approved_leave' },
      };
    if (weeklyOff)
      return {
        status: AttendanceStatus.WeeklyOff,
        workedMinutes: 0,
        lateMinutes: 0,
        earlyExitMinutes: 0,
        overtimeMinutes: 0,
        calculationTrace: { reason: 'weekly_off' },
      };
    if (!punches.length)
      return {
        status: AttendanceStatus.Absent,
        workedMinutes: 0,
        lateMinutes: 0,
        earlyExitMinutes: 0,
        overtimeMinutes: 0,
        calculationTrace: { reason: 'no_punch' },
      };
    if (punches.length === 1)
      return {
        status: AttendanceStatus.MissingPunch,
        firstIn: punches[0].punchedAt,
        workedMinutes: 0,
        lateMinutes: 0,
        earlyExitMinutes: 0,
        overtimeMinutes: 0,
        calculationTrace: { punchIds: punches.map((item) => item.id) },
      };
    const firstIn = punches[0].punchedAt;
    const lastOut = punches[punches.length - 1].punchedAt;
    const workedMinutes = Math.max(
      0,
      Math.round((lastOut.getTime() - firstIn.getTime()) / 60000) -
        (shift?.breakMinutes ?? 0),
    );
    let lateMinutes = 0;
    let earlyExitMinutes = 0;
    let overtimeMinutes = 0;
    if (shift) {
      const expectedStart = this.zonedDate(workDate, shift.startTime, timezone);
      let expectedEnd = this.zonedDate(workDate, shift.endTime, timezone);
      if (shift.isOvernight || expectedEnd <= expectedStart)
        expectedEnd = new Date(expectedEnd.getTime() + 86400000);
      lateMinutes = Math.max(
        0,
        Math.round((firstIn.getTime() - expectedStart.getTime()) / 60000) -
          shift.graceInMinutes,
      );
      earlyExitMinutes = Math.max(
        0,
        Math.round((expectedEnd.getTime() - lastOut.getTime()) / 60000) -
          shift.graceOutMinutes,
      );
      overtimeMinutes = Math.max(
        0,
        workedMinutes -
          Math.round(
            (expectedEnd.getTime() - expectedStart.getTime()) / 60000,
          ) +
          shift.breakMinutes -
          shift.overtimeAfterMinutes,
      );
      overtimeMinutes = Math.min(
        overtimeMinutes,
        overtimeCap ?? Number.MAX_SAFE_INTEGER,
      );
    }
    const round = (value: number) =>
      Math.round(value / Math.max(1, roundingMinutes)) *
      Math.max(1, roundingMinutes);
    return {
      status: AttendanceStatus.Present,
      firstIn,
      lastOut,
      workedMinutes: round(workedMinutes),
      lateMinutes: round(lateMinutes),
      earlyExitMinutes: round(earlyExitMinutes),
      overtimeMinutes: round(overtimeMinutes),
      calculationTrace: {
        punchIds: punches.map((item) => item.id),
        shiftCode: shift?.code ?? null,
        timezone,
      },
    };
  }

  private async paginated<T extends { organizationId: string }>(
    repository: Repository<T>,
    organizationId: string,
    query: TenantPaginationDto,
    alias: string,
  ) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const [items, total] = await repository
      .createQueryBuilder(alias)
      .where(`${alias}.organization_id = :organizationId`, { organizationId })
      .orderBy(`${alias}.created_at`, 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();
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

  private async requireEmployee(organizationId: string, id: string) {
    const employee = await this.employees.findOne({
      where: { id, organizationId },
    });
    if (!employee)
      throw new NotFoundException(
        'Employee not found in the selected organization.',
      );
    return employee;
  }

  private async validateLifecycleReferences(
    organizationId: string,
    dto: EmployeeLifecycleDto,
  ) {
    const references: Array<[string | undefined, string, string]> = [
      [dto.factoryId, 'factory', 'Factory'],
      [dto.departmentId, 'departments', 'Department'],
      [dto.designationId, 'hr-designations', 'Designation'],
      [dto.supervisorId, 'employees', 'Supervisor'],
      [dto.gradeId, 'hr_master_data', 'Grade'],
      [dto.payGroupId, 'hr_master_data', 'Pay group'],
    ];
    for (const [id, table, label] of references) {
      if (!id) continue;
      const rows = await this.dataSource.query<Array<{ id: string }>>(
        `SELECT id FROM "${table}" WHERE id = $1 AND organization_id = $2 LIMIT 1`,
        [id, organizationId],
      );
      if (!rows.length)
        throw new BadRequestException(
          `${label} not found in the selected organization.`,
        );
    }
  }

  private validateTime(value: string) {
    if (!/^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/.test(value))
      throw new BadRequestException(`Invalid time: ${value}.`);
  }
  private nextDate(value: string) {
    const date = new Date(`${value}T00:00:00Z`);
    date.setUTCDate(date.getUTCDate() + 1);
    return date.toISOString().slice(0, 10);
  }
  private previousDate(value: string) {
    const date = new Date(`${value}T00:00:00Z`);
    date.setUTCDate(date.getUTCDate() - 1);
    return date.toISOString().slice(0, 10);
  }
  private dateInTimezone(value: Date, timezone: string) {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(value);
  }
  private zonedDate(date: string, time: string, timezone: string) {
    const desired = new Date(`${date}T${time}Z`);
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(desired);
    const get = (type: string) =>
      Number(parts.find((part) => part.type === type)?.value ?? 0);
    const represented = Date.UTC(
      get('year'),
      get('month') - 1,
      get('day'),
      get('hour'),
      get('minute'),
      get('second'),
    );
    return new Date(desired.getTime() - (represented - desired.getTime()));
  }
  private punchesForShiftDay(
    punches: AttendancePunch[],
    workDate: string,
    shift: Shift,
    timezone: string,
  ) {
    const start = this.zonedDate(workDate, shift.startTime, timezone);
    let end = this.zonedDate(workDate, shift.endTime, timezone);
    if (shift.isOvernight || end <= start)
      end = new Date(end.getTime() + 86400000);
    const windowStart = start.getTime() - 6 * 3600000;
    const windowEnd = end.getTime() + 6 * 3600000;
    return punches.filter(
      (punch) =>
        punch.punchedAt.getTime() >= windowStart &&
        punch.punchedAt.getTime() <= windowEnd,
    );
  }
  private dateRange(from: string, to: string, max: number) {
    if (to < from)
      throw new BadRequestException('End date cannot precede start date.');
    const values: string[] = [];
    let cursor = from;
    while (cursor <= to) {
      values.push(cursor);
      if (values.length > max)
        throw new BadRequestException(`Date range cannot exceed ${max} days.`);
      cursor = this.nextDate(cursor);
    }
    return values;
  }
  private chunk<T>(values: T[], size: number) {
    return Array.from({ length: Math.ceil(values.length / size) }, (_, index) =>
      values.slice(index * size, (index + 1) * size),
    );
  }
}

@Injectable()
export class CompensationService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Employee)
    private readonly employees: Repository<Employee>,
    @InjectRepository(SalaryStructure)
    private readonly structures: Repository<SalaryStructure>,
    @InjectRepository(SalaryStructureComponent)
    private readonly components: Repository<SalaryStructureComponent>,
    @InjectRepository(EmployeeSalaryAssignment)
    private readonly assignments: Repository<EmployeeSalaryAssignment>,
    @InjectRepository(EmployeeLoan)
    private readonly loans: Repository<EmployeeLoan>,
    @InjectRepository(LoanInstallment)
    private readonly installments: Repository<LoanInstallment>,
    @InjectRepository(StatutoryRulePack)
    private readonly rulePacks: Repository<StatutoryRulePack>,
    private readonly formulas: FormulaEngineService,
    private readonly audit: HrAuditService,
  ) {}

  async createStructure(
    organizationId: string,
    userId: string,
    dto: CreateSalaryStructureDto,
  ) {
    this.formulas.orderDefinitions(dto.components, EXTERNAL_FORMULA_VARIABLES);
    return this.dataSource.transaction(async (manager) => {
      const latest = await manager
        .getRepository(SalaryStructure)
        .createQueryBuilder('structure')
        .select('MAX(structure.version)', 'version')
        .where(
          'structure.organization_id = :organizationId AND structure.code = :code',
          { organizationId, code: dto.code.trim().toUpperCase() },
        )
        .getRawOne<{ version: string | null }>();
      const structure = await manager.save(
        manager.create(SalaryStructure, {
          organizationId,
          code: dto.code.trim().toUpperCase(),
          name: dto.name.trim(),
          version: Number(latest?.version ?? 0) + 1,
          effectiveFrom: dto.effectiveFrom,
          effectiveTo: dto.effectiveTo,
          createdById: userId,
          isActive: false,
        }),
      );
      await manager.save(
        dto.components.map((component) =>
          manager.create(SalaryStructureComponent, {
            ...component,
            code: component.code.trim().toUpperCase(),
            salaryStructureId: structure.id,
          }),
        ),
      );
      await this.audit.record(
        organizationId,
        userId,
        'CREATE',
        'SalaryStructure',
        structure.id,
        null,
        structure,
      );
      return this.getStructure(organizationId, structure.id);
    });
  }

  async activateStructure(organizationId: string, userId: string, id: string) {
    const structure = await this.requireStructure(organizationId, id);
    structure.isActive = true;
    structure.updatedById = userId;
    await this.structures.save(structure);
    await this.audit.record(
      organizationId,
      userId,
      'ACTIVATE',
      'SalaryStructure',
      id,
    );
    return structure;
  }

  async getStructure(organizationId: string, id: string) {
    const structure = await this.requireStructure(organizationId, id);
    return {
      ...structure,
      components: await this.components.find({
        where: { salaryStructureId: id },
        order: { sortOrder: 'ASC' },
      }),
    };
  }

  listStructures(organizationId: string) {
    return this.structures.find({
      where: { organizationId },
      order: { code: 'ASC', version: 'DESC' },
    });
  }

  async assignSalary(
    organizationId: string,
    userId: string,
    dto: AssignSalaryDto,
  ) {
    const employee = await this.employees.findOne({
      where: { id: dto.employeeId, organizationId },
    });
    if (!employee) throw new NotFoundException('Employee not found.');
    const structure = await this.requireStructure(
      organizationId,
      dto.salaryStructureId,
    );
    if (!structure.isActive)
      throw new BadRequestException(
        'Salary structure must be active before assignment.',
      );
    const overlap = await this.assignments
      .createQueryBuilder('assignment')
      .where(
        'assignment.organization_id = :organizationId AND assignment.employee_id = :employeeId',
        { organizationId, employeeId: dto.employeeId },
      )
      .andWhere('assignment.effective_from <= :endDate', {
        endDate: dto.effectiveTo ?? '9999-12-31',
      })
      .andWhere(
        '(assignment.effective_to IS NULL OR assignment.effective_to >= :startDate)',
        { startDate: dto.effectiveFrom },
      )
      .getOne();
    if (overlap)
      throw new ConflictException(
        'An existing salary assignment overlaps this effective period.',
      );
    const saved = await this.assignments.save(
      this.assignments.create({
        ...dto,
        baseAmount: String(dto.baseAmount),
        currency: dto.currency ?? 'BDT',
        componentOverrides: dto.componentOverrides ?? {},
        organizationId,
        createdById: userId,
      }),
    );
    await this.audit.record(
      organizationId,
      userId,
      'ASSIGN',
      'EmployeeSalaryAssignment',
      saved.id,
      null,
      saved,
    );
    return saved;
  }

  async createLoan(organizationId: string, userId: string, dto: CreateLoanDto) {
    const employee = await this.employees.findOne({
      where: { id: dto.employeeId, organizationId },
    });
    if (!employee) throw new NotFoundException('Employee not found.');
    const existing = await this.loans.findOne({
      where: { organizationId, loanNumber: dto.loanNumber },
    });
    if (existing) throw new ConflictException('Loan number already exists.');
    const loan = await this.loans.save(
      this.loans.create({
        ...dto,
        principal: String(dto.principal),
        installmentAmount: String(dto.installmentAmount),
        outstandingAmount: String(dto.principal),
        organizationId,
        createdById: userId,
      }),
    );
    const schedule: LoanInstallment[] = [];
    let outstanding = dto.principal;
    const cursor = new Date(`${dto.startDate}T00:00:00Z`);
    while (outstanding > 0 && schedule.length < 600) {
      const amount = Math.min(outstanding, dto.installmentAmount);
      schedule.push(
        this.installments.create({
          loanId: loan.id,
          dueDate: cursor.toISOString().slice(0, 10),
          amount: String(amount),
          paidAmount: '0',
        }),
      );
      outstanding = Number((outstanding - amount).toFixed(4));
      cursor.setUTCMonth(cursor.getUTCMonth() + 1);
    }
    await this.installments.save(schedule);
    return { ...loan, installments: schedule };
  }

  async changeLoanStatus(
    organizationId: string,
    userId: string,
    id: string,
    dto: LoanStatusDto,
  ) {
    const loan = await this.loans.findOne({ where: { id, organizationId } });
    if (!loan) throw new NotFoundException('Loan not found.');
    if (loan.rowVersion !== dto.rowVersion)
      throw new ConflictException('The loan was changed by another user.');
    const allowed: Record<LoanStatus, LoanStatus[]> = {
      [LoanStatus.Draft]: [LoanStatus.Approved, LoanStatus.Cancelled],
      [LoanStatus.Approved]: [LoanStatus.Active, LoanStatus.Cancelled],
      [LoanStatus.Active]: [LoanStatus.Paused, LoanStatus.Settled],
      [LoanStatus.Paused]: [
        LoanStatus.Active,
        LoanStatus.Settled,
        LoanStatus.Cancelled,
      ],
      [LoanStatus.Settled]: [],
      [LoanStatus.Cancelled]: [],
    };
    if (!allowed[loan.status].includes(dto.status))
      throw new ConflictException(
        `Loan cannot transition from ${loan.status} to ${dto.status}.`,
      );
    loan.status = dto.status;
    loan.updatedById = userId;
    const saved = await this.loans.save(loan);
    await this.audit.record(
      organizationId,
      userId,
      `LOAN_${dto.status}`,
      'EmployeeLoan',
      id,
    );
    return saved;
  }

  async createRulePack(
    organizationId: string,
    userId: string,
    dto: CreateRulePackDto,
  ) {
    const latest = await this.rulePacks
      .createQueryBuilder('pack')
      .select('MAX(pack.version)', 'version')
      .where('pack.organization_id = :organizationId AND pack.code = :code', {
        organizationId,
        code: dto.code.trim().toUpperCase(),
      })
      .getRawOne<{ version: string | null }>();
    return this.rulePacks.save(
      this.rulePacks.create({
        ...dto,
        code: dto.code.trim().toUpperCase(),
        jurisdiction: dto.jurisdiction ?? 'BD',
        version: Number(latest?.version ?? 0) + 1,
        organizationId,
        createdById: userId,
        reviewStatus: ApprovalStatus.Draft,
      }),
    );
  }

  async approveRulePack(organizationId: string, userId: string, id: string) {
    const pack = await this.rulePacks.findOne({
      where: { id, organizationId },
    });
    if (!pack) throw new NotFoundException('Statutory rule pack not found.');
    if (pack.lockedAt)
      throw new ConflictException(
        'A locked statutory rule pack cannot be changed.',
      );
    if (pack.createdById === userId)
      throw new ForbiddenException(
        'The author cannot approve the same statutory rule pack.',
      );
    pack.reviewStatus = ApprovalStatus.Approved;
    pack.approvedById = userId;
    pack.approvedAt = new Date();
    pack.updatedById = userId;
    const saved = await this.rulePacks.save(pack);
    await this.audit.record(
      organizationId,
      userId,
      'APPROVE',
      'StatutoryRulePack',
      id,
    );
    return saved;
  }

  listRulePacks(organizationId: string) {
    return this.rulePacks.find({
      where: { organizationId },
      order: { code: 'ASC', version: 'DESC' },
    });
  }

  async seedBangladeshRules(organizationId: string, userId: string) {
    const existing = await this.rulePacks.findOne({
      where: { organizationId, code: 'BD-AY-2026-27', version: 1 },
    });
    if (existing) return existing;
    const pack = this.rulePacks.create({
      organizationId,
      createdById: userId,
      code: 'BD-AY-2026-27',
      name: 'Bangladesh payroll rules AY 2026-27',
      jurisdiction: 'BD',
      version: 1,
      effectiveFrom: '2026-07-01',
      effectiveTo: '2027-06-30',
      reviewStatus: ApprovalStatus.Draft,
      sourceUrl: 'https://nbr.gov.bd/uploads/budget/Budget_Speech_English.pdf',
      sourcePublishedAt: '2026-06-01',
      rules: {
        legalReviewRequired: true,
        tax: {
          annualTaxFreeThreshold: 375000,
          brackets: [
            { upto: 300000, rate: 0.1 },
            { upto: 400000, rate: 0.15 },
            { upto: 500000, rate: 0.2 },
            { upto: 2000000, rate: 0.25 },
            { upto: null, rate: 0.3 },
          ],
          monthlyRounding: 2,
        },
        overtime: {
          multiplier: 2,
          ordinaryWageBasis: ['BASIC', 'DEARNESS_ALLOWANCE', 'INTERIM_WAGE'],
          sourceUrl: 'https://mole.gov.bd/pages/legislative-informations/',
        },
        providentFund: { enabled: false, employeeRate: 0, employerRate: 0 },
        gratuity: { enabled: false },
      },
    });
    const saved = await this.rulePacks.save(pack);
    await this.audit.record(
      organizationId,
      userId,
      'SEED_DRAFT',
      'StatutoryRulePack',
      saved.id,
      null,
      saved,
    );
    return saved;
  }

  private async requireStructure(organizationId: string, id: string) {
    const structure = await this.structures.findOne({
      where: { id, organizationId },
    });
    if (!structure) throw new NotFoundException('Salary structure not found.');
    return structure;
  }
}

export { EXTERNAL_FORMULA_VARIABLES };
