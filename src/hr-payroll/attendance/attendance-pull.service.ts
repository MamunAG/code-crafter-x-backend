import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash } from 'node:crypto';
import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import { Repository } from 'typeorm';
import { AuditService } from '../audit/audit.service';
import { AttendanceDirection } from '../common/hr.enums';
import { AttendanceService } from './attendance.service';
import {
  CreateAttendancePullIntegrationDto,
  TestAttendancePullIntegrationDto,
  UpdateAttendancePullIntegrationDto,
} from './dto/attendance-pull-integration.dto';
import type { AttendancePunchItemDto } from './dto/attendance-punch-item.dto';
import { AttendancePullIntegration } from './entity/attendance-pull-integration.entity';
import {
  AttendancePullFieldMapping,
  AttendancePullMethod,
  AttendancePullRequestConfig,
  AttendanceSecretLocation,
} from './attendance-pull.types';

type PullDto =
  | CreateAttendancePullIntegrationDto
  | UpdateAttendancePullIntegrationDto;
type TemplateContext = {
  now: string;
  lastRunAt: string;
  lastSuccessAt: string;
  cursor: string;
  organizationId: string;
};

@Injectable()
export class AttendancePullService {
  private readonly maxResponseBytes = 2 * 1024 * 1024;

  constructor(
    @InjectRepository(AttendancePullIntegration)
    private readonly integrations: Repository<AttendancePullIntegration>,
    private readonly attendance: AttendanceService,
    private readonly audit: AuditService,
    private readonly config: ConfigService,
  ) {}

  async list(organizationId: string) {
    const records = await this.integrations.find({
      where: { organizationId },
      order: { createdAt: 'DESC' },
    });
    return records.map((record) => this.toPublic(record));
  }

  async create(
    organizationId: string,
    userId: string,
    dto: CreateAttendancePullIntegrationDto,
  ) {
    await this.validateEndpoint(dto.endpointUrl);
    await this.ensureSourceUnique(organizationId, dto.source);
    this.validateMappings(dto.mappings ?? [], dto.isActive ?? false);
    this.validateSchedule(
      dto.scheduleIntervalMinutes ?? null,
      dto.isActive ?? false,
    );
    const entity = this.integrations.create({
      organizationId,
      createdById: userId,
      updatedById: userId,
      name: dto.name.trim(),
      source: dto.source.trim().toUpperCase(),
      endpointUrl: dto.endpointUrl.trim(),
      method: dto.method,
      requestConfig: this.buildRequestConfig(dto),
      responseItemsPath: dto.responseItemsPath?.trim() || null,
      mappings: dto.mappings ?? [],
      directionMap: dto.directionMap ?? {},
      cursorResponsePath: dto.cursorResponsePath?.trim() || null,
      scheduleIntervalMinutes: dto.scheduleIntervalMinutes ?? null,
      isActive: dto.isActive ?? false,
      nextRunAt:
        dto.isActive && dto.scheduleIntervalMinutes ? new Date() : null,
    });
    const saved = await this.integrations.save(entity);
    await this.audit.record(
      organizationId,
      userId,
      'CREATE',
      'AttendancePullIntegration',
      saved.id,
      null,
      { name: saved.name, source: saved.source },
    );
    return this.toPublic(saved);
  }

  async update(
    organizationId: string,
    userId: string,
    id: string,
    dto: UpdateAttendancePullIntegrationDto,
  ) {
    const entity = await this.requireOne(organizationId, id);
    if (dto.endpointUrl) await this.validateEndpoint(dto.endpointUrl);
    if (dto.source)
      await this.ensureSourceUnique(organizationId, dto.source, id);
    const nextMappings = dto.mappings ?? entity.mappings;
    const nextActive = dto.isActive ?? entity.isActive;
    const nextInterval =
      dto.scheduleIntervalMinutes === undefined
        ? entity.scheduleIntervalMinutes
        : dto.scheduleIntervalMinutes;
    this.validateMappings(nextMappings, nextActive);
    this.validateSchedule(nextInterval, nextActive);
    const before = this.toPublic(entity);
    if (dto.name !== undefined) entity.name = dto.name.trim();
    if (dto.source !== undefined)
      entity.source = dto.source.trim().toUpperCase();
    if (dto.endpointUrl !== undefined)
      entity.endpointUrl = dto.endpointUrl.trim();
    if (dto.method !== undefined) entity.method = dto.method;
    entity.requestConfig = this.buildRequestConfig(dto, entity.requestConfig);
    if (dto.responseItemsPath !== undefined)
      entity.responseItemsPath = dto.responseItemsPath?.trim() || null;
    if (dto.mappings !== undefined) entity.mappings = dto.mappings;
    if (dto.directionMap !== undefined) entity.directionMap = dto.directionMap;
    if (dto.cursorResponsePath !== undefined)
      entity.cursorResponsePath = dto.cursorResponsePath?.trim() || null;
    if (dto.scheduleIntervalMinutes !== undefined)
      entity.scheduleIntervalMinutes = dto.scheduleIntervalMinutes;
    if (dto.isActive !== undefined) entity.isActive = dto.isActive;
    entity.updatedById = userId;
    entity.nextRunAt =
      entity.isActive && entity.scheduleIntervalMinutes ? new Date() : null;
    const saved = await this.integrations.save(entity);
    await this.audit.record(
      organizationId,
      userId,
      'UPDATE',
      'AttendancePullIntegration',
      id,
      before,
      this.toPublic(saved),
    );
    return this.toPublic(saved);
  }

  async remove(organizationId: string, userId: string, id: string) {
    const entity = await this.requireOne(organizationId, id);
    await this.integrations.remove(entity);
    await this.audit.record(
      organizationId,
      userId,
      'DELETE',
      'AttendancePullIntegration',
      id,
      { name: entity.name, source: entity.source },
    );
    return { deleted: true };
  }

  async test(organizationId: string, dto: TestAttendancePullIntegrationDto) {
    const existing = dto.integrationId
      ? await this.requireOne(organizationId, dto.integrationId)
      : undefined;
    const draft = this.draftIntegration(organizationId, dto, existing);
    const response = await this.fetchVendor(draft);
    const items = this.responseItems(response, draft.responseItemsPath);
    const sample = items.slice(0, 3);
    return {
      itemCount: items.length,
      availablePaths: sample.length ? this.discoverPaths(sample[0]) : [],
      sample,
      mappedPreview: draft.mappings.length
        ? sample.map((item) => this.mapPunch(item, draft))
        : [],
      cursorPreview: draft.cursorResponsePath
        ? (this.readPath(response, draft.cursorResponsePath) ?? null)
        : null,
    };
  }

  async syncNow(organizationId: string, userId: string, id: string) {
    const entity = await this.requireOne(organizationId, id);
    const result = await this.run(entity, 'MANUAL');
    await this.audit.record(
      organizationId,
      userId,
      'SYNC',
      'AttendancePullIntegration',
      id,
      null,
      result,
    );
    return result;
  }

  @Cron('0 * * * * *', { name: 'attendance-pull-integrations' })
  async runScheduled() {
    const due = await this.integrations
      .createQueryBuilder('integration')
      .where('integration.is_active = true')
      .andWhere('integration.schedule_interval_minutes IS NOT NULL')
      .andWhere(
        '(integration.next_run_at IS NULL OR integration.next_run_at <= NOW())',
      )
      .andWhere(
        '(integration.sync_locked_until IS NULL OR integration.sync_locked_until < NOW())',
      )
      .orderBy('integration.next_run_at', 'ASC')
      .take(25)
      .getMany();
    for (const integration of due) {
      try {
        await this.run(integration, 'SCHEDULED');
      } catch {
        /* persisted by run */
      }
    }
  }

  private async run(
    entity: AttendancePullIntegration,
    trigger: 'MANUAL' | 'SCHEDULED',
  ) {
    this.validateMappings(entity.mappings, true);
    const claimedUntil = new Date(Date.now() + 5 * 60_000);
    const claim = await this.integrations
      .createQueryBuilder()
      .update()
      .set({
        syncLockedUntil: claimedUntil,
        lastStatus: 'RUNNING',
        lastRunAt: new Date(),
      })
      .where('id = :id AND organization_id = :organizationId', {
        id: entity.id,
        organizationId: entity.organizationId,
      })
      .andWhere('(sync_locked_until IS NULL OR sync_locked_until < NOW())')
      .execute();
    if (!claim.affected)
      throw new ConflictException(
        'This attendance integration is already syncing.',
      );
    try {
      const response = await this.fetchVendor(entity);
      const items = this.responseItems(response, entity.responseItemsPath);
      const punches = items.map((item) => this.mapPunch(item, entity));
      const result = await this.attendance.ingest(entity.organizationId, {
        source: entity.source,
        punches,
      });
      const cursor = entity.cursorResponsePath
        ? this.readPath(response, entity.cursorResponsePath)
        : undefined;
      const now = new Date();
      entity.lastCursor =
        cursor == null ? entity.lastCursor : this.textValue(cursor, 'Cursor');
      entity.lastRunAt = now;
      entity.lastSuccessAt = now;
      entity.lastStatus = 'SUCCESS';
      entity.lastError = null;
      entity.lastResult = { trigger, fetched: items.length, ...result };
      entity.syncLockedUntil = null;
      entity.nextRunAt =
        entity.isActive && entity.scheduleIntervalMinutes
          ? new Date(now.getTime() + entity.scheduleIntervalMinutes * 60_000)
          : null;
      await this.integrations.save(entity);
      return entity.lastResult;
    } catch (error) {
      const now = new Date();
      entity.lastRunAt = now;
      entity.lastStatus = 'FAILED';
      entity.lastError =
        error instanceof Error
          ? error.message.slice(0, 4000)
          : 'Attendance synchronization failed.';
      entity.lastResult = { trigger };
      entity.syncLockedUntil = null;
      entity.nextRunAt =
        entity.isActive && entity.scheduleIntervalMinutes
          ? new Date(now.getTime() + entity.scheduleIntervalMinutes * 60_000)
          : null;
      await this.integrations.save(entity);
      throw error;
    }
  }

  private async fetchVendor(entity: AttendancePullIntegration) {
    await this.validateEndpoint(entity.endpointUrl);
    const context: TemplateContext = {
      now: new Date().toISOString(),
      lastRunAt: entity.lastRunAt?.toISOString() ?? '',
      lastSuccessAt: entity.lastSuccessAt?.toISOString() ?? '',
      cursor: entity.lastCursor ?? '',
      organizationId: entity.organizationId,
    };
    const config = entity.requestConfig;
    const renderedHeaders = this.render(config.headers, context);
    const renderedQuery = this.render(config.query, context);
    if (!this.isRecord(renderedHeaders) || !this.isRecord(renderedQuery))
      throw new BadRequestException(
        'Headers and query parameters must be JSON objects.',
      );
    const headers = Object.fromEntries(
      Object.entries(renderedHeaders).map(([key, value]) => [
        key,
        this.textValue(value, `Header ${key}`),
      ]),
    );
    const query = renderedQuery;
    let body = this.render(config.body, context);
    const url = new URL(entity.endpointUrl);
    for (const [key, value] of Object.entries(query)) {
      if (value != null)
        url.searchParams.set(
          key,
          this.textValue(value, `Query parameter ${key}`, true),
        );
    }
    if (config.secret?.value) {
      const secret = this.renderString(config.secret.value, context);
      if (config.secret.location === AttendanceSecretLocation.Header)
        headers[config.secret.key] = secret;
      if (config.secret.location === AttendanceSecretLocation.Query)
        url.searchParams.set(config.secret.key, secret);
      if (config.secret.location === AttendanceSecretLocation.Body) {
        if (!body || typeof body !== 'object' || Array.isArray(body)) body = {};
        body = {
          ...(body as Record<string, unknown>),
          [config.secret.key]: secret,
        };
      }
    }
    if (
      entity.method === AttendancePullMethod.Post &&
      !headers['Content-Type'] &&
      !headers['content-type']
    )
      headers['Content-Type'] = 'application/json';
    const response = await fetch(url, {
      method: entity.method,
      headers,
      body:
        entity.method === AttendancePullMethod.Post
          ? JSON.stringify(body ?? {})
          : undefined,
      redirect: 'error',
      signal: AbortSignal.timeout(20_000),
    });
    const declaredSize = Number(response.headers.get('content-length') ?? 0);
    if (declaredSize > this.maxResponseBytes)
      throw new BadRequestException(
        'The vendor response exceeds the 2 MB limit.',
      );
    const text = await response.text();
    if (Buffer.byteLength(text) > this.maxResponseBytes)
      throw new BadRequestException(
        'The vendor response exceeds the 2 MB limit.',
      );
    if (!response.ok)
      throw new BadRequestException(
        `Vendor API returned HTTP ${response.status}.`,
      );
    try {
      return JSON.parse(text) as unknown;
    } catch {
      throw new BadRequestException('Vendor API response is not valid JSON.');
    }
  }

  private mapPunch(
    item: unknown,
    entity: Pick<AttendancePullIntegration, 'mappings' | 'directionMap'>,
  ): AttendancePunchItemDto {
    const mapped: Record<string, unknown> = {};
    for (const mapping of entity.mappings)
      mapped[mapping.targetField] = this.readPath(item, mapping.sourcePath);
    const eventValue = mapped.externalEventId;
    if (
      eventValue == null ||
      this.textValue(eventValue, 'External event ID').trim() === ''
    ) {
      mapped.externalEventId = createHash('sha256')
        .update(JSON.stringify(item))
        .digest('hex');
    } else
      mapped.externalEventId = this.textValue(eventValue, 'External event ID');
    if (mapped.employeeId != null)
      mapped.employeeId = this.textValue(mapped.employeeId, 'Employee ID');
    if (mapped.employeeCode != null)
      mapped.employeeCode = this.textValue(
        mapped.employeeCode,
        'Employee code',
      );
    if (
      mapped.punchedAt == null ||
      !this.textValue(mapped.punchedAt, 'Punch time').trim()
    )
      throw new BadRequestException('Mapped punch time is empty.');
    mapped.punchedAt = new Date(
      this.textValue(mapped.punchedAt, 'Punch time'),
    ).toISOString();
    const rawDirection = this.textValue(
      mapped.direction ?? 'UNKNOWN',
      'Direction',
    );
    const direction = this.textValue(
      entity.directionMap[rawDirection] ?? rawDirection,
      'Mapped direction',
    ).toUpperCase();
    mapped.direction = Object.values(AttendanceDirection).includes(
      direction as AttendanceDirection,
    )
      ? direction
      : AttendanceDirection.Unknown;
    if (mapped.deviceIdentifier != null)
      mapped.deviceIdentifier = this.textValue(
        mapped.deviceIdentifier,
        'Device identifier',
      );
    if (!this.isRecord(mapped.metadata)) mapped.metadata = {};
    return {
      externalEventId: this.textValue(
        mapped.externalEventId,
        'External event ID',
      ),
      employeeId:
        mapped.employeeId == null
          ? undefined
          : this.textValue(mapped.employeeId, 'Employee ID'),
      employeeCode:
        mapped.employeeCode == null
          ? undefined
          : this.textValue(mapped.employeeCode, 'Employee code'),
      punchedAt: this.textValue(mapped.punchedAt, 'Punch time'),
      direction: mapped.direction as AttendanceDirection,
      deviceIdentifier:
        mapped.deviceIdentifier == null
          ? undefined
          : this.textValue(mapped.deviceIdentifier, 'Device identifier'),
      metadata: mapped.metadata as Record<string, unknown>,
    };
  }

  private responseItems(response: unknown, path?: string | null): unknown[] {
    const selected = path?.trim() ? this.readPath(response, path) : response;
    if (Array.isArray(selected)) return selected;
    if (selected && typeof selected === 'object') return [selected];
    throw new BadRequestException(
      'The configured response items path does not resolve to an object or array.',
    );
  }

  private validateMappings(
    mappings: AttendancePullFieldMapping[],
    active: boolean,
  ) {
    const targets = mappings.map((mapping) => mapping.targetField);
    if (new Set(targets).size !== targets.length)
      throw new BadRequestException(
        'Each internal attendance field can be mapped only once.',
      );
    if (!active) return;
    if (!targets.includes('punchedAt'))
      throw new BadRequestException(
        'Punch time mapping is required before activating an integration.',
      );
    if (!targets.includes('employeeId') && !targets.includes('employeeCode'))
      throw new BadRequestException(
        'Employee ID or employee code mapping is required before activating an integration.',
      );
  }

  private validateSchedule(
    intervalMinutes: number | null | undefined,
    active: boolean,
  ) {
    if (active && !intervalMinutes)
      throw new BadRequestException(
        'A repeat interval is required before activating recurring synchronization.',
      );
  }

  private buildRequestConfig(
    dto: PullDto,
    existing?: AttendancePullRequestConfig,
  ): AttendancePullRequestConfig {
    const secretDto = dto.secret;
    const retainedSecret = existing?.secret;
    const secret = secretDto
      ? {
          location: secretDto.location,
          key: secretDto.key.trim(),
          value: secretDto.value?.trim() || retainedSecret?.value || '',
        }
      : retainedSecret;
    return {
      headers: dto.headers ?? existing?.headers ?? {},
      query: dto.query ?? existing?.query ?? {},
      body: dto.body !== undefined ? dto.body : existing?.body,
      secret: secret?.key && secret.value ? secret : undefined,
    };
  }

  private draftIntegration(
    organizationId: string,
    dto: TestAttendancePullIntegrationDto,
    existing?: AttendancePullIntegration,
  ) {
    return this.integrations.create({
      ...existing,
      organizationId,
      endpointUrl: dto.endpointUrl || existing?.endpointUrl,
      method: dto.method || existing?.method,
      source: (dto.source || existing?.source || 'TEST').trim().toUpperCase(),
      requestConfig: this.buildRequestConfig(dto, existing?.requestConfig),
      responseItemsPath: dto.responseItemsPath ?? existing?.responseItemsPath,
      mappings: dto.mappings ?? existing?.mappings ?? [],
      directionMap: dto.directionMap ?? existing?.directionMap ?? {},
      cursorResponsePath:
        dto.cursorResponsePath ?? existing?.cursorResponsePath,
      lastCursor: existing?.lastCursor,
      lastRunAt: existing?.lastRunAt,
      lastSuccessAt: existing?.lastSuccessAt,
    });
  }

  private toPublic(entity: AttendancePullIntegration) {
    const secret = entity.requestConfig.secret;
    return {
      ...entity,
      requestConfig: {
        headers: entity.requestConfig.headers,
        query: entity.requestConfig.query,
        body: entity.requestConfig.body,
        secret: secret
          ? {
              location: secret.location,
              key: secret.key,
              value: '',
              configured: true,
            }
          : undefined,
      },
    };
  }

  private async requireOne(organizationId: string, id: string) {
    const entity = await this.integrations.findOne({
      where: { id, organizationId },
    });
    if (!entity)
      throw new NotFoundException('Attendance pull integration not found.');
    return entity;
  }

  private async ensureSourceUnique(
    organizationId: string,
    source: string,
    ignoreId?: string,
  ) {
    const normalized = source.trim().toUpperCase();
    const existing = await this.integrations.findOne({
      where: { organizationId, source: normalized },
    });
    if (existing && existing.id !== ignoreId)
      throw new ConflictException(
        'An attendance pull integration already uses this source.',
      );
  }

  private readPath(value: unknown, path?: string | null): unknown {
    if (!path?.trim()) return value;
    return path
      .replace(/\[(\d+)\]/g, '.$1')
      .split('.')
      .filter(Boolean)
      .reduce<unknown>(
        (current, key) =>
          current && typeof current === 'object'
            ? (current as Record<string, unknown>)[key]
            : undefined,
        value,
      );
  }

  private discoverPaths(value: unknown, prefix = '', depth = 0): string[] {
    if (depth > 5 || value == null || typeof value !== 'object')
      return prefix ? [prefix] : [];
    const entries = Array.isArray(value)
      ? value.slice(0, 1).map((item, index) => [String(index), item] as const)
      : Object.entries(value);
    return [
      ...new Set(
        entries.flatMap(([key, item]) => {
          const path = prefix ? `${prefix}.${key}` : key;
          return item != null && typeof item === 'object'
            ? [path, ...this.discoverPaths(item, path, depth + 1)]
            : [path];
        }),
      ),
    ].slice(0, 250);
  }

  private render(value: unknown, context: TemplateContext): unknown {
    if (typeof value === 'string') return this.renderString(value, context);
    if (Array.isArray(value))
      return value.map((item) => this.render(item, context));
    if (value && typeof value === 'object')
      return Object.fromEntries(
        Object.entries(value).map(([key, item]) => [
          key,
          this.render(item, context),
        ]),
      );
    return value;
  }

  private renderString(value: string, context: TemplateContext) {
    return value.replace(
      /{{\s*(now|lastRunAt|lastSuccessAt|cursor|organizationId)\s*}}/g,
      (_match: string, key: keyof TemplateContext) => context[key],
    );
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
  }

  private textValue(value: unknown, label: string, allowJson = false) {
    if (typeof value === 'string') return value;
    if (
      typeof value === 'number' ||
      typeof value === 'boolean' ||
      typeof value === 'bigint'
    )
      return String(value);
    if (allowJson && value && typeof value === 'object')
      return JSON.stringify(value);
    throw new BadRequestException(
      `${label} must resolve to a string, number, or boolean.`,
    );
  }

  private async validateEndpoint(endpoint: string) {
    const url = new URL(endpoint);
    if (!['http:', 'https:'].includes(url.protocol))
      throw new BadRequestException(
        'Only HTTP and HTTPS vendor endpoints are supported.',
      );
    const allowPrivate =
      this.config.get<string>('ATTENDANCE_PULL_ALLOW_PRIVATE_NETWORKS') ===
      'true';
    if (allowPrivate) return;
    if (url.hostname === 'localhost' || url.hostname.endsWith('.local'))
      throw new ForbiddenException(
        'Private attendance endpoints are disabled on this server.',
      );
    const addresses = isIP(url.hostname)
      ? [{ address: url.hostname }]
      : await lookup(url.hostname, { all: true });
    if (addresses.some(({ address }) => this.isPrivateAddress(address)))
      throw new ForbiddenException(
        'Private attendance endpoints are disabled on this server.',
      );
  }

  private isPrivateAddress(address: string) {
    const normalized = address.toLowerCase();
    if (
      normalized === '::1' ||
      normalized === '0:0:0:0:0:0:0:1' ||
      normalized.startsWith('fc') ||
      normalized.startsWith('fd') ||
      normalized.startsWith('fe80:')
    )
      return true;
    const ipv4 = normalized.startsWith('::ffff:')
      ? normalized.slice(7)
      : normalized;
    const parts = ipv4.split('.').map(Number);
    if (parts.length !== 4 || parts.some(Number.isNaN)) return false;
    return (
      parts[0] === 10 ||
      parts[0] === 127 ||
      parts[0] === 0 ||
      (parts[0] === 169 && parts[1] === 254) ||
      (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
      (parts[0] === 192 && parts[1] === 168)
    );
  }
}
