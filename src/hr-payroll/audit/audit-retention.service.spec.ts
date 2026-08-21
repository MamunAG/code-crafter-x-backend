import type { Repository } from 'typeorm';
import { AuditRetentionService } from './audit-retention.service';
import type { AuditService } from './audit.service';
import { AuditCategory, AuditModuleName, AuditStatus } from './audit.types';
import type { AuditEventInput } from './audit.types';
import type { AuditEvent } from './entity/audit-event.entity';

describe('AuditRetentionService', () => {
  it('deletes expired events in batches and writes a cleanup summary', async () => {
    const find = jest
      .fn()
      .mockResolvedValueOnce([{ id: 'event-1' }, { id: 'event-2' }])
      .mockResolvedValueOnce([]);
    const remove = jest.fn().mockResolvedValue({ affected: 2 });
    const recorded: AuditEventInput[] = [];
    const service = new AuditRetentionService(
      { find, delete: remove } as unknown as Repository<AuditEvent>,
      {
        recordEvent: (event: AuditEventInput) => {
          recorded.push(event);
          return Promise.resolve();
        },
      } as unknown as AuditService,
    );

    await expect(service.removeExpired()).resolves.toMatchObject({ deleted: 2 });
    expect(remove).toHaveBeenCalledWith(['event-1', 'event-2']);
    expect(recorded[0]).toMatchObject({
      moduleName: AuditModuleName.System,
      category: AuditCategory.Cron,
      status: AuditStatus.Success,
    });
    expect(recorded[0].metadata).toMatchObject({ retentionDays: 90, deleted: 2 });
  });
});
