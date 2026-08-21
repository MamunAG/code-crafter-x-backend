import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateHrAuditLogDescription1787900000000 implements MigrationInterface {
  name = 'UpdateHrAuditLogDescription1787900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "menu"
      SET "description" = 'All retained HR and payroll activity and scheduled job runs'
      WHERE "menu_name" = 'HR Audit Log'
        AND "module_id" IN (
          SELECT "id" FROM "module_entry" WHERE "module_key" = 'hr-payroll'
        )
        AND "deleted_at" IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "menu"
      SET "description" = 'Last five days of HR activity and scheduled job runs'
      WHERE "menu_name" = 'HR Audit Log'
        AND "module_id" IN (
          SELECT "id" FROM "module_entry" WHERE "module_key" = 'hr-payroll'
        )
        AND "deleted_at" IS NULL
    `);
  }
}
