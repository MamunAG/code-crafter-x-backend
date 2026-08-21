import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { AuditService } from './audit.service';
import {
  AuditCategory,
  AuditModuleName,
  AuditScheduleStatus,
  AuditStatus,
} from './audit.types';

export type AuditedCronDefinition = {
  moduleName: AuditModuleName;
  organizationId?: string | null;
  jobName: string;
  schedule: string;
  scheduledFor: Date;
  subjectId?: string;
  metadata?: Record<string, unknown>;
  delayedAfterSeconds?: number;
  missedAfterSeconds?: number;
};

@Injectable()
export class AuditCronService {
  constructor(private readonly audit: AuditService) {}

  async run<T>(definition: AuditedCronDefinition, task: () => Promise<T>) {
    const runId = randomUUID();
    const startedAt = new Date();
    const delaySeconds = Math.max(
      0,
      Math.round(
        (startedAt.getTime() - definition.scheduledFor.getTime()) / 1000,
      ),
    );
    const scheduleStatus =
      delaySeconds > (definition.missedAfterSeconds ?? Number.MAX_SAFE_INTEGER)
        ? AuditScheduleStatus.Missed
        : delaySeconds > (definition.delayedAfterSeconds ?? 90)
          ? AuditScheduleStatus.Delayed
          : AuditScheduleStatus.OnSchedule;
    const common = {
      moduleName: definition.moduleName,
      category: AuditCategory.Cron,
      organizationId: definition.organizationId,
      actorId: null,
      actorName: 'System scheduler',
      subjectType: 'CronJob',
      subjectId: definition.subjectId ?? definition.jobName,
      jobName: definition.jobName,
      schedule: definition.schedule,
      runId,
      scheduledFor: definition.scheduledFor,
      startedAt,
      scheduleStatus,
      metadata: { ...definition.metadata, delaySeconds },
    };
    await this.audit.recordEvent({
      ...common,
      status: AuditStatus.Started,
      action: 'CRON_STARTED',
    });
    try {
      const result = await task();
      await this.audit.recordEvent({
        ...common,
        status: AuditStatus.Success,
        action: 'CRON_SUCCESS',
        completedAt: new Date(),
      });
      return result;
    } catch (error) {
      await this.audit.recordEvent({
        ...common,
        status: AuditStatus.Error,
        action: 'CRON_ERROR',
        completedAt: new Date(),
        scheduleStatus: AuditScheduleStatus.Failed,
        errorCode: error instanceof Error ? error.name : 'CronError',
        errorMessage:
          error instanceof Error
            ? error.message.slice(0, 2000)
            : 'Scheduled job failed.',
      });
      throw error;
    }
  }
}
