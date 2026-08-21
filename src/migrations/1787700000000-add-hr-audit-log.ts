import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddHrAuditLog1787700000000 implements MigrationInterface {
  name = 'AddHrAuditLog1787700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_hr_audit_tenant_created" ON "hr_audit_events" ("organization_id", "created_at" DESC)`,
    );
    await queryRunner.query(`
      INSERT INTO "menu" ("menu_name", "menu_path", "module_id", "description", "display_order", "is_active")
      SELECT 'HR Audit Log', '/hr-payroll/audit-log', module.id, 'Last five days of HR activity and scheduled job runs', 15, true
      FROM "module_entry" module
      WHERE module."module_key" = 'hr-payroll'
        AND module."deleted_at" IS NULL
        AND NOT EXISTS (
          SELECT 1 FROM "menu" existing
          WHERE existing."menu_name" = 'HR Audit Log'
            AND existing."module_id" = module.id
            AND existing."deleted_at" IS NULL
        )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM "menu"
      WHERE "menu_name" = 'HR Audit Log'
        AND "module_id" IN (
          SELECT "id" FROM "module_entry" WHERE "module_key" = 'hr-payroll'
        )
    `);
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_hr_audit_tenant_created"`,
    );
  }
}
