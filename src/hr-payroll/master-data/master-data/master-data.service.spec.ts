import { BadRequestException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { HrMasterDataType } from '../../common/hr.enums';
import { AuditService } from '../../audit/audit.service';
import { MasterData } from './entity/master-data.entity';
import { MasterDataService } from './master-data.service';

describe('MasterDataService category behavior', () => {
  const factoryFindOne = jest.fn();
  const repository = {
    create: jest.fn((value: Partial<MasterData>) => ({ id: 'item-id', rowVersion: 1, ...value }) as MasterData),
    save: jest.fn((value: MasterData) => Promise.resolve(value)),
    manager: { getRepository: jest.fn(() => ({ findOne: factoryFindOne })) },
  };
  const audit = { record: jest.fn(() => Promise.resolve(undefined)) };
  const service = new MasterDataService(repository as unknown as Repository<MasterData>, audit as unknown as AuditService);

  beforeEach(() => jest.clearAllMocks());

  it('locks category creation to the supplied type and normalizes the code', async () => {
    const result = await service.createForType('organization-id', 'user-id', HrMasterDataType.EmploymentType, {
      code: 'permanent', name: ' Permanent ', settings: { employmentCategory: 'PERMANENT', leaveEligible: true }, isActive: true,
    });

    expect(result).toMatchObject({ type: HrMasterDataType.EmploymentType, code: 'PERMANENT', name: 'Permanent' });
    expect(audit.record).toHaveBeenCalledWith('organization-id', 'user-id', 'CREATE', 'HrMasterData', 'item-id', null, expect.any(Object));
  });

  it('rejects unsupported category settings', async () => {
    await expect(service.createForType('organization-id', 'user-id', HrMasterDataType.Grade, {
      code: 'G1', name: 'Grade 1', settings: { frequency: 'MONTHLY' },
    })).rejects.toBeInstanceOf(BadRequestException);
  });

  it('derives legacy holiday dates from structured holiday rows', async () => {
    const result = await service.createForType('organization-id', 'user-id', HrMasterDataType.HolidayCalendar, {
      code: 'BD-2026', name: 'Bangladesh 2026', settings: { year: 2026, weeklyRestDays: [5], holidays: [{ date: '2026-02-21', name: 'Language Martyrs Day' }] },
    });

    expect(result.settings).toMatchObject({ dates: ['2026-02-21'] });
  });

  it('preserves legacy generic settings for backward compatibility', async () => {
    const result = await service.create('organization-id', 'user-id', {
      type: HrMasterDataType.Grade, code: 'LEGACY', name: 'Legacy', settings: { legacyFlag: 'kept' },
    });

    expect(result.settings).toEqual({ legacyFlag: 'kept' });
  });

  it('rejects a work-location factory outside the selected organization', async () => {
    factoryFindOne.mockResolvedValueOnce(null);
    await expect(service.createForType('organization-id', 'user-id', HrMasterDataType.WorkLocation, {
      code: 'DHK', name: 'Dhaka', settings: { locationType: 'FACTORY', factoryId: 'e428dd22-9bb0-4a12-8ce1-94bfab1b1c9a' },
    })).rejects.toThrow('The selected factory is not active in this organization.');
    expect(factoryFindOne).toHaveBeenCalledWith({ where: { id: 'e428dd22-9bb0-4a12-8ce1-94bfab1b1c9a', organizationId: 'organization-id', isActive: true } });
  });
});
