import {
  resolveAuditModule,
  shouldAuditRequest,
} from './audit-module.resolver';
import { AuditModuleName } from './audit.types';

describe('audit module resolver', () => {
  it.each([
    ['/api/v1/hr/attendance', AuditModuleName.HrPayroll],
    ['/api/v1/style', AuditModuleName.Merchandising],
    ['/api/v1/currency', AuditModuleName.AppConfig],
    ['/api/v1/auth/login', AuditModuleName.Iam],
    ['/api/v1/files', AuditModuleName.System],
  ])('maps %s to %s', (path, expected) => {
    expect(resolveAuditModule(path)).toBe(expected);
  });

  it('excludes infrastructure and audit-reader traffic', () => {
    expect(shouldAuditRequest('GET', '/api/v1/hr/health')).toBe(false);
    expect(shouldAuditRequest('GET', '/api/docs')).toBe(false);
    expect(shouldAuditRequest('GET', '/api/v1/hr/audit-log')).toBe(false);
    expect(shouldAuditRequest('GET', '/api/v1/audit-log')).toBe(false);
    expect(shouldAuditRequest('GET', '/api/v1/merchandising/audit-log')).toBe(
      false,
    );
    expect(shouldAuditRequest('GET', '/api/v1/iam/audit-log')).toBe(false);
    expect(shouldAuditRequest('OPTIONS', '/api/v1/style')).toBe(false);
    expect(shouldAuditRequest('POST', '/api/v1/hr/attendance')).toBe(true);
  });
});
