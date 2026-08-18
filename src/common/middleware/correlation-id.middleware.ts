import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'crypto';
import type { NextFunction, Request, Response } from 'express';

@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HttpRequest');

  use(request: Request & { requestId?: string }, response: Response, next: NextFunction) {
    const supplied = request.header('x-request-id');
    const requestId = supplied && /^[A-Za-z0-9._:-]{1,120}$/.test(supplied) ? supplied : randomUUID();
    request.requestId = requestId;
    response.setHeader('x-request-id', requestId);
    const startedAt = Date.now();
    response.once('finish', () => this.logger.log(JSON.stringify({
      event: 'http_request', requestId, method: request.method, path: request.originalUrl.split('?')[0],
      statusCode: response.statusCode, durationMs: Date.now() - startedAt,
    })));
    next();
  }
}
