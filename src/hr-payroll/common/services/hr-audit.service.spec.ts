import { Repository } from 'typeorm';
import {
  AuditCategory,
  AuditModuleName,
  AuditStatus,
} from '../../audit/audit.types';
import { HrAuditEvent } from '../entity';
import { HrAuditService } from './hr-platform.service';

describe('HrAuditService', () => {
  it('lists all retained HR audit events for only the selected organization', async () => {
    const builder: Record<string, jest.Mock> = {};
    for (const method of [
      'leftJoin',
      'where',
      'andWhere',
      'select',
      'addSelect',
      'orderBy',
      'addOrderBy',
      'skip',
      'take',
    ]) {
      builder[method] = jest.fn(() => builder);
    }
    builder.clone = jest.fn(() => builder);
    builder.getCount = jest.fn().mockResolvedValue(2);
    builder.getRawMany = jest.fn().mockResolvedValue([{ id: 'event-2' }]);
    builder.getRawOne = jest.fn().mockResolvedValue({
      total: '2',
      cronTotal: '1',
      cronOnSchedule: '1',
      issues: '0',
    });

    const repository = {
      createQueryBuilder: jest.fn(() => builder),
    } as unknown as Repository<HrAuditEvent>;
    const service = new HrAuditService(repository);

    const result = await service.listRecent('organization-1', {
      page: 2,
      limit: 50,
      category: AuditCategory.Api,
      status: AuditStatus.Success,
    });

    expect(builder.where).toHaveBeenCalledWith(
      'event.module_name = :moduleName',
      { moduleName: AuditModuleName.HrPayroll },
    );
    expect(builder.andWhere).toHaveBeenCalledWith(
      'event.organization_id = :organizationId',
      { organizationId: 'organization-1' },
    );
    expect(
      builder.andWhere.mock.calls.some(([condition]) =>
        String(condition).includes('event.created_at'),
      ),
    ).toBe(false);
    expect(builder.orderBy).toHaveBeenCalledWith('event.created_at', 'DESC');
    expect(builder.addOrderBy).toHaveBeenCalledWith('event.id', 'DESC');
    expect(builder.skip).toHaveBeenCalledWith(50);
    expect(builder.take).toHaveBeenCalledWith(50);
    expect(result).not.toHaveProperty('days');
    expect(result).not.toHaveProperty('since');
    expect(result).toMatchObject({
      page: 2,
      limit: 50,
      total: 2,
      totalPages: 1,
      stats: { total: 2, cronTotal: 1, cronOnSchedule: 1, issues: 0 },
      events: [{ id: 'event-2' }],
    });
  });

  it('uses the requested module when listing shared audit events', async () => {
    const builder: Record<string, jest.Mock> = {};
    for (const method of [
      'leftJoin',
      'where',
      'andWhere',
      'select',
      'addSelect',
      'orderBy',
      'addOrderBy',
      'skip',
      'take',
    ]) {
      builder[method] = jest.fn(() => builder);
    }
    builder.clone = jest.fn(() => builder);
    builder.getCount = jest.fn().mockResolvedValue(0);
    builder.getRawMany = jest.fn().mockResolvedValue([]);
    builder.getRawOne = jest.fn().mockResolvedValue({});

    const repository = {
      createQueryBuilder: jest.fn(() => builder),
    } as unknown as Repository<HrAuditEvent>;
    const service = new HrAuditService(repository);

    await service.listRecent(
      'organization-1',
      {},
      AuditModuleName.Merchandising,
    );

    expect(builder.where).toHaveBeenCalledWith(
      'event.module_name = :moduleName',
      { moduleName: AuditModuleName.Merchandising },
    );
  });

  it('lists organization-wide events when the module scope is omitted explicitly', async () => {
    const builder: Record<string, jest.Mock> = {};
    for (const method of [
      'leftJoin',
      'where',
      'andWhere',
      'select',
      'addSelect',
      'orderBy',
      'addOrderBy',
      'skip',
      'take',
    ]) {
      builder[method] = jest.fn(() => builder);
    }
    builder.clone = jest.fn(() => builder);
    builder.getCount = jest.fn().mockResolvedValue(0);
    builder.getRawMany = jest.fn().mockResolvedValue([]);
    builder.getRawOne = jest.fn().mockResolvedValue({});

    const repository = {
      createQueryBuilder: jest.fn(() => builder),
    } as unknown as Repository<HrAuditEvent>;
    const service = new HrAuditService(repository);

    await service.listRecent('organization-1', {}, null);

    expect(builder.where).toHaveBeenCalledWith(
      'event.organization_id = :organizationId',
      { organizationId: 'organization-1' },
    );
    expect(builder.where).not.toHaveBeenCalledWith(
      'event.module_name = :moduleName',
      expect.anything(),
    );
  });
});
