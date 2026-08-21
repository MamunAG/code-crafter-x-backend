import { AuditModuleName } from './audit.types';

const MERCHANDISING_PREFIXES = [
  '/api/v1/buyer',
  '/api/v1/style',
  '/api/v1/job',
  '/api/v1/order-placement',
  '/api/v1/tna',
  '/api/v1/tna-task',
  '/api/v1/fabric-costing',
  '/api/v1/color',
  '/api/v1/size',
  '/api/v1/fabric-process',
  '/api/v1/embellishment',
  '/api/v1/gmt-cost-scope',
];

const IAM_PREFIXES = [
  '/api/v1/auth',
  '/api/v1/users',
  '/api/v1/menu-permission',
  '/api/v1/user-to-oranization-map',
  '/api/v1/organization-access-requests',
];

const APP_CONFIG_PREFIXES = [
  '/api/v1/country',
  '/api/v1/currency',
  '/api/v1/unit',
  '/api/v1/menu',
  '/api/v1/menu-to-organization-map',
  '/api/v1/module-entry',
  '/api/v1/organization',
  '/api/v1/factory',
  '/api/v1/supplier',
  '/api/v1/material',
  '/api/v1/material-group',
];

export function resolveAuditModule(path: string) {
  if (path.startsWith('/api/v1/hr')) return AuditModuleName.HrPayroll;
  if (MERCHANDISING_PREFIXES.some((prefix) => path.startsWith(prefix)))
    return AuditModuleName.Merchandising;
  if (IAM_PREFIXES.some((prefix) => path.startsWith(prefix)))
    return AuditModuleName.Iam;
  if (APP_CONFIG_PREFIXES.some((prefix) => path.startsWith(prefix)))
    return AuditModuleName.AppConfig;
  return AuditModuleName.System;
}

export function shouldAuditRequest(method: string, path: string) {
  if (method === 'OPTIONS' || !path.startsWith('/api/')) return false;
  return !['/api/docs', '/api/v1/hr/health', '/api/v1/hr/audit-log'].some(
    (prefix) => path.startsWith(prefix),
  );
}
