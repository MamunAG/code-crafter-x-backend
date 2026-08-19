import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddHrBasicEntryLifecycle1787100000000 implements MigrationInterface {
  name = 'AddHrBasicEntryLifecycle1787100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "hr_master_data" ADD "deleted_at" TIMESTAMP WITH TIME ZONE`);
    await queryRunner.query(`ALTER TABLE "hr_master_data" ADD "deleted_by_id" uuid`);
    await queryRunner.query(`CREATE INDEX "idx_hr_master_data_deleted_at" ON "hr_master_data" ("deleted_at")`);
    await queryRunner.query(`CREATE INDEX "idx_hr_master_data_scope_deleted" ON "hr_master_data" ("organization_id", "type", "deleted_at")`);
    await queryRunner.query(`
      INSERT INTO "menu" ("menu_name", "menu_path", "module_id", "description", "display_order", "is_active")
      SELECT entries.name, entries.path, module.id, entries.description, entries.display_order, true
      FROM (VALUES
        ('Employment Type Setup', '/hr-payroll/core/employment-type', 'Employment type master data', 3),
        ('Grade Setup', '/hr-payroll/core/grade', 'Employee grade master data', 4),
        ('Pay Group Setup', '/hr-payroll/core/pay-group', 'Payroll group master data', 5),
        ('Work Location Setup', '/hr-payroll/core/work-location', 'Work location master data', 6),
        ('Holiday Calendar Setup', '/hr-payroll/core/holiday-calendar', 'Holiday calendar master data', 7),
        ('Leave Type Setup', '/hr-payroll/core/leave-type', 'Leave type master data', 8),
        ('Salary Component Setup', '/hr-payroll/core/salary-component', 'Salary component master data', 9),
        ('Separation Reason Setup', '/hr-payroll/core/separation-reason', 'Separation reason master data', 10)
      ) AS entries(name, path, description, display_order)
      CROSS JOIN LATERAL (
        SELECT id FROM "module_entry" WHERE "module_key" = 'hr-payroll' AND "deleted_at" IS NULL ORDER BY "created_at" LIMIT 1
      ) module
      WHERE NOT EXISTS (
        SELECT 1 FROM "menu" existing WHERE existing."menu_name" = entries.name AND existing."module_id" = module.id AND existing."deleted_at" IS NULL
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM "menu" WHERE "module_id" IN (SELECT "id" FROM "module_entry" WHERE "module_key" = 'hr-payroll') AND "menu_name" IN ('Employment Type Setup','Grade Setup','Pay Group Setup','Work Location Setup','Holiday Calendar Setup','Leave Type Setup','Salary Component Setup','Separation Reason Setup')`);
    await queryRunner.query(`DROP INDEX "public"."idx_hr_master_data_scope_deleted"`);
    await queryRunner.query(`DROP INDEX "public"."idx_hr_master_data_deleted_at"`);
    await queryRunner.query(`ALTER TABLE "hr_master_data" DROP COLUMN "deleted_by_id"`);
    await queryRunner.query(`ALTER TABLE "hr_master_data" DROP COLUMN "deleted_at"`);
  }
}
