export enum AuditModuleName {
  HrPayroll = 'HR_PAYROLL',
  Merchandising = 'MERCHANDISING',
  AppConfig = 'APP_CONFIG',
  Iam = 'IAM',
  System = 'SYSTEM',
}

export enum AuditCategory {
  Api = 'API',
  Business = 'BUSINESS',
  Cron = 'CRON',
}

export enum AuditStatus {
  Started = 'STARTED',
  Success = 'SUCCESS',
  Error = 'ERROR',
  Aborted = 'ABORTED',
}

export enum AuditScheduleStatus {
  OnSchedule = 'ON_SCHEDULE',
  Delayed = 'DELAYED',
  Missed = 'MISSED',
  Failed = 'FAILED',
}

export type AuditEventInput = {
  moduleName: AuditModuleName;
  category: AuditCategory;
  status: AuditStatus;
  organizationId?: string | null;
  actorId?: string | null;
  actorName?: string | null;
  action: string;
  subjectType: string;
  subjectId: string;
  httpMethod?: string | null;
  route?: string | null;
  statusCode?: number | null;
  requestId?: string | null;
  durationMs?: number | null;
  errorCode?: string | null;
  errorMessage?: string | null;
  clientIp?: string | null;
  userAgent?: string | null;
  jobName?: string | null;
  schedule?: string | null;
  runId?: string | null;
  scheduledFor?: Date | null;
  startedAt?: Date | null;
  completedAt?: Date | null;
  scheduleStatus?: AuditScheduleStatus | null;
  beforeState?: Record<string, unknown> | null;
  afterState?: Record<string, unknown> | null;
  metadata?: Record<string, unknown>;
};
