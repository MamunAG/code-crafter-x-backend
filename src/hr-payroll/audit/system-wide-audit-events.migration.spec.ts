import { QueryRunner } from 'typeorm';
import { SystemWideAuditEvents1787800000000 } from '../../migrations/1787800000000-system-wide-audit-events';

describe('SystemWideAuditEvents1787800000000', () => {
  it('removes the legacy immutable trigger before backfilling audit rows', async () => {
    const statements: string[] = [];
    const queryRunner = {
      query: jest.fn((statement: string) => {
        statements.push(statement);
        return Promise.resolve();
      }),
    } as unknown as QueryRunner;

    await new SystemWideAuditEvents1787800000000().up(queryRunner);

    const indexOf = (fragment: string) =>
      statements.findIndex((statement) => statement.includes(fragment));
    const renameTable = indexOf(
      'ALTER TABLE "hr_audit_events" RENAME TO "audit_events"',
    );
    const dropLegacyTrigger = indexOf(
      'DROP TRIGGER IF EXISTS "trg_hr_audit_immutable"',
    );
    const backfillActors = indexOf('UPDATE "audit_events" event');
    const createUpdateTrigger = indexOf(
      'CREATE TRIGGER trg_audit_events_immutable',
    );

    expect(renameTable).toBeGreaterThanOrEqual(0);
    expect(dropLegacyTrigger).toBeGreaterThan(renameTable);
    expect(backfillActors).toBeGreaterThan(dropLegacyTrigger);
    expect(createUpdateTrigger).toBeGreaterThan(backfillActors);
  });
});
