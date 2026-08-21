import { Injectable, NestMiddleware } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import type { NextFunction, Request, Response } from 'express';
import type AuthUser from 'src/auth/dto/auth-user';
import type { AuditErrorContext } from '../filters/audit-exception.filter';
import { AuditService } from '../../hr-payroll/audit/audit.service';
import {
  AuditCategory,
  AuditStatus,
} from '../../hr-payroll/audit/audit.types';
import {
  resolveAuditModule,
  shouldAuditRequest,
} from '../../hr-payroll/audit/audit-module.resolver';

type AuditedRequest = Request & {
  requestId?: string;
  user?: AuthUser;
};

type AuditedResponse = Response & {
  locals: { auditError?: AuditErrorContext };
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  constructor(
    private readonly audit: AuditService,
    private readonly config: ConfigService,
  ) {}

  use(request: AuditedRequest, response: AuditedResponse, next: NextFunction) {
    const supplied = request.header('x-request-id');
    const requestId =
      supplied && /^[A-Za-z0-9._:-]{1,120}$/.test(supplied)
        ? supplied
        : randomUUID();
    request.requestId = requestId;
    response.setHeader('x-request-id', requestId);
    const startedAt = Date.now();
    const path = request.originalUrl.split('?')[0];
    let recorded = false;
    const record = (aborted: boolean) => {
      if (recorded || !shouldAuditRequest(request.method, path)) return;
      recorded = true;
      const error = response.locals.auditError;
      const organizationHeader = request.header('x-organization-id');
      void this.audit.recordEvent({
        moduleName: resolveAuditModule(path),
        category: AuditCategory.Api,
        status: aborted
          ? AuditStatus.Aborted
          : response.statusCode >= 400
            ? AuditStatus.Error
            : AuditStatus.Success,
        organizationId:
          organizationHeader && UUID_PATTERN.test(organizationHeader)
            ? organizationHeader
            : null,
        actorId: request.user?.userId ?? null,
        actorName: request.user?.email ?? null,
        action: `${request.method} ${path}`.slice(0, 120),
        subjectType: 'HttpRequest',
        subjectId: requestId,
        httpMethod: request.method.slice(0, 12),
        route: path.slice(0, 500),
        statusCode: response.statusCode,
        requestId,
        durationMs: Date.now() - startedAt,
        errorCode:
          error?.code ??
          (response.statusCode >= 400 ? `HTTP_${response.statusCode}` : null),
        errorMessage: error?.message ?? null,
        clientIp: this.clientIp(request),
        userAgent: request.header('user-agent')?.slice(0, 2000) ?? null,
      });
    };
    response.once('finish', () => record(false));
    response.once('close', () => {
      if (!response.writableFinished) record(true);
    });
    next();
  }

  private clientIp(request: Request) {
    if (this.config.get<string>('TRUST_PROXY') === 'true') {
      const forwarded = request
        .header('x-forwarded-for')
        ?.split(',')[0]
        ?.trim();
      if (forwarded) return forwarded.slice(0, 64);
    }
    return request.socket.remoteAddress?.slice(0, 64) ?? null;
  }
}
