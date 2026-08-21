import { ArgumentsHost, Catch, HttpException } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { BaseExceptionFilter } from '@nestjs/core';
import type { Response } from 'express';

export type AuditErrorContext = {
  code: string;
  message: string;
};

@Catch()
export class AuditExceptionFilter extends BaseExceptionFilter {
  constructor(adapterHost: HttpAdapterHost) {
    super(adapterHost.httpAdapter);
  }

  catch(exception: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    response.locals.auditError = this.errorContext(exception);
    super.catch(exception, host);
  }

  private errorContext(exception: unknown): AuditErrorContext {
    if (exception instanceof HttpException) {
      const payload = exception.getResponse();
      const message =
        typeof payload === 'string'
          ? payload
          : this.messageFromPayload(payload) || exception.message;
      return {
        code: exception.constructor.name,
        message: message.slice(0, 2000),
      };
    }
    return {
      code: exception instanceof Error ? exception.name : 'InternalError',
      message: 'Internal server error',
    };
  }

  private messageFromPayload(payload: object) {
    if (!('message' in payload)) return '';
    const message = payload.message;
    if (Array.isArray(message)) return message.map(String).join(' ');
    return typeof message === 'string' ? message : '';
  }
}
