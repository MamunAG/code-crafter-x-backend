import { EventEmitter } from 'node:events';
import type { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import type { AuditService } from 'src/hr-payroll/audit/audit.service';
import { AuditCategory, AuditStatus } from 'src/hr-payroll/audit/audit.types';
import type { AuditEventInput } from 'src/hr-payroll/audit/audit.types';
import { CorrelationIdMiddleware } from './correlation-id.middleware';

describe('CorrelationIdMiddleware', () => {
  it('records safe request metadata after a successful response', () => {
    const recorded: AuditEventInput[] = [];
    const audit = {
      recordEvent: (event: AuditEventInput) => {
        recorded.push(event);
        return Promise.resolve();
      },
    };
    const middleware = new CorrelationIdMiddleware(
      audit as unknown as AuditService,
      { get: jest.fn().mockReturnValue('false') } as unknown as ConfigService,
    );
    const request = Object.assign(new EventEmitter(), {
      method: 'POST',
      originalUrl: '/api/v1/hr/attendance?token=secret',
      socket: { remoteAddress: '127.0.0.1' },
      user: {
        userId: '00000000-0000-4000-8000-000000000001',
        email: 'actor@example.com',
      },
      header: (name: string) =>
        ({
          'x-request-id': 'request-1',
          'x-organization-id': '00000000-0000-4000-8000-000000000002',
          'user-agent': 'test-agent',
          authorization: 'Bearer secret',
        })[name.toLowerCase()],
    });
    const response = Object.assign(new EventEmitter(), {
      locals: {},
      statusCode: 201,
      writableFinished: true,
      setHeader: jest.fn(),
    });
    middleware.use(
      request as unknown as Request,
      response as unknown as Response,
      jest.fn(),
    );
    response.emit('finish');
    expect(recorded[0]).toEqual(
      expect.objectContaining({
        category: AuditCategory.Api,
        status: AuditStatus.Success,
        route: '/api/v1/hr/attendance',
        requestId: 'request-1',
        actorName: 'actor@example.com',
        clientIp: '127.0.0.1',
      }),
    );
    expect(JSON.stringify(recorded[0])).not.toContain('Bearer secret');
  });
});
