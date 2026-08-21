import { AuditCronService } from './audit-cron.service';
import { AuditService } from './audit.service';
import {
  AuditModuleName,
  AuditScheduleStatus,
  AuditStatus,
} from './audit.types';
import type { AuditEventInput } from './audit.types';

describe('AuditCronService', () => {
  const recorded: AuditEventInput[] = [];
  const audit = {
    recordEvent: (event: AuditEventInput) => {
      recorded.push(event);
      return Promise.resolve();
    },
  };
  const service = new AuditCronService(audit as unknown as AuditService);

  beforeEach(() => {
    recorded.length = 0;
  });

  it('records started and successful terminal events with the same run id', async () => {
    const scheduledFor = new Date();
    await expect(
      service.run(
        {
          moduleName: AuditModuleName.HrPayroll,
          organizationId: '00000000-0000-4000-8000-000000000001',
          jobName: 'test-job',
          schedule: '* * * * *',
          scheduledFor,
        },
        () => Promise.resolve('done'),
      ),
    ).resolves.toBe('done');
    expect(recorded).toHaveLength(2);
    expect(recorded[0]).toMatchObject({
      status: AuditStatus.Started,
      scheduleStatus: AuditScheduleStatus.OnSchedule,
    });
    expect(recorded[1]).toMatchObject({
      status: AuditStatus.Success,
    });
    expect(recorded[0].runId).toBe(recorded[1].runId);
  });

  it('records sanitized cron failures and rethrows', async () => {
    await expect(
      service.run(
        {
          moduleName: AuditModuleName.AppConfig,
          jobName: 'failed-job',
          schedule: '0 0 * * *',
          scheduledFor: new Date(),
        },
        () => Promise.reject(new Error('provider unavailable')),
      ),
    ).rejects.toThrow('provider unavailable');
    expect(recorded[1]).toMatchObject({
      status: AuditStatus.Error,
      scheduleStatus: AuditScheduleStatus.Failed,
      errorCode: 'Error',
      errorMessage: 'provider unavailable',
    });
  });
});
