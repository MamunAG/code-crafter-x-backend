import { MigrationInterface, QueryRunner } from 'typeorm';

export class SystemWideAuditEvents1787800000000 implements MigrationInterface {
  name = 'SystemWideAuditEvents1787800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "hr_audit_events" RENAME TO "audit_events"`,
    );
    await queryRunner.query(
      `DROP TRIGGER IF EXISTS "trg_hr_audit_immutable" ON "audit_events"`,
    );
    await queryRunner.query(
      `DROP FUNCTION IF EXISTS hr_prevent_audit_mutation()`,
    );
    await queryRunner.query(
      `ALTER TABLE "audit_events" ALTER COLUMN "organization_id" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "audit_events" ADD "module_name" character varying(80) NOT NULL DEFAULT 'HR_PAYROLL'`,
    );
    await queryRunner.query(
      `ALTER TABLE "audit_events" ADD "category" character varying(30) NOT NULL DEFAULT 'BUSINESS'`,
    );
    await queryRunner.query(
      `ALTER TABLE "audit_events" ADD "status" character varying(30) NOT NULL DEFAULT 'SUCCESS'`,
    );
    await queryRunner.query(
      `ALTER TABLE "audit_events" ADD "actor_name" character varying(255)`,
    );
    await queryRunner.query(
      `ALTER TABLE "audit_events" ADD "http_method" character varying(12)`,
    );
    await queryRunner.query(
      `ALTER TABLE "audit_events" ADD "route" character varying(500)`,
    );
    await queryRunner.query(
      `ALTER TABLE "audit_events" ADD "status_code" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "audit_events" ADD "request_id" character varying(120)`,
    );
    await queryRunner.query(
      `ALTER TABLE "audit_events" ADD "duration_ms" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "audit_events" ADD "error_code" character varying(120)`,
    );
    await queryRunner.query(
      `ALTER TABLE "audit_events" ADD "error_message" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "audit_events" ADD "client_ip" character varying(64)`,
    );
    await queryRunner.query(`ALTER TABLE "audit_events" ADD "user_agent" text`);
    await queryRunner.query(
      `ALTER TABLE "audit_events" ADD "job_name" character varying(160)`,
    );
    await queryRunner.query(
      `ALTER TABLE "audit_events" ADD "schedule" character varying(160)`,
    );
    await queryRunner.query(`ALTER TABLE "audit_events" ADD "run_id" uuid`);
    await queryRunner.query(
      `ALTER TABLE "audit_events" ADD "scheduled_for" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `ALTER TABLE "audit_events" ADD "started_at" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `ALTER TABLE "audit_events" ADD "completed_at" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `ALTER TABLE "audit_events" ADD "schedule_status" character varying(30)`,
    );
    await queryRunner.query(
      `UPDATE "audit_events" event SET "actor_name" = COALESCE(NULLIF(TRIM(actor."name"), ''), actor."email") FROM "users" actor WHERE actor."id" = event."actor_id" AND event."actor_name" IS NULL`,
    );
    await queryRunner.query(
      `CREATE OR REPLACE FUNCTION prevent_audit_event_update() RETURNS trigger AS $$ BEGIN RAISE EXCEPTION 'Audit events are immutable'; END; $$ LANGUAGE plpgsql`,
    );
    await queryRunner.query(
      `CREATE TRIGGER trg_audit_events_immutable BEFORE UPDATE ON "audit_events" FOR EACH ROW EXECUTE FUNCTION prevent_audit_event_update()`,
    );
    await queryRunner.query(
      `ALTER INDEX IF EXISTS "idx_hr_audit_tenant_subject" RENAME TO "idx_audit_tenant_subject"`,
    );
    await queryRunner.query(
      `ALTER INDEX IF EXISTS "idx_hr_audit_tenant_created" RENAME TO "idx_audit_tenant_created"`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_audit_module_created" ON "audit_events" ("module_name", "created_at" DESC)`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_audit_status_created" ON "audit_events" ("status", "created_at" DESC)`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_audit_actor_created" ON "audit_events" ("actor_id", "created_at" DESC)`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_audit_request_id" ON "audit_events" ("request_id") WHERE "request_id" IS NOT NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_audit_run_id" ON "audit_events" ("run_id") WHERE "run_id" IS NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_audit_run_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_audit_request_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_audit_actor_created"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_audit_status_created"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_audit_module_created"`);
    await queryRunner.query(
      `DROP TRIGGER IF EXISTS "trg_audit_events_immutable" ON "audit_events"`,
    );
    await queryRunner.query(
      `DROP FUNCTION IF EXISTS prevent_audit_event_update()`,
    );
    await queryRunner.query(
      `DELETE FROM "audit_events" WHERE "organization_id" IS NULL`,
    );
    for (const column of [
      'schedule_status',
      'completed_at',
      'started_at',
      'scheduled_for',
      'run_id',
      'schedule',
      'job_name',
      'user_agent',
      'client_ip',
      'error_message',
      'error_code',
      'duration_ms',
      'request_id',
      'status_code',
      'route',
      'http_method',
      'actor_name',
      'status',
      'category',
      'module_name',
    ]) {
      await queryRunner.query(
        `ALTER TABLE "audit_events" DROP COLUMN "${column}"`,
      );
    }
    await queryRunner.query(
      `ALTER TABLE "audit_events" ALTER COLUMN "organization_id" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER INDEX IF EXISTS "idx_audit_tenant_subject" RENAME TO "idx_hr_audit_tenant_subject"`,
    );
    await queryRunner.query(
      `ALTER INDEX IF EXISTS "idx_audit_tenant_created" RENAME TO "idx_hr_audit_tenant_created"`,
    );
    await queryRunner.query(
      `ALTER TABLE "audit_events" RENAME TO "hr_audit_events"`,
    );
    await queryRunner.query(
      `CREATE OR REPLACE FUNCTION hr_prevent_audit_mutation() RETURNS trigger AS $$ BEGIN RAISE EXCEPTION 'HR audit events are immutable'; END; $$ LANGUAGE plpgsql`,
    );
    await queryRunner.query(
      `CREATE TRIGGER trg_hr_audit_immutable BEFORE UPDATE OR DELETE ON "hr_audit_events" FOR EACH ROW EXECUTE FUNCTION hr_prevent_audit_mutation()`,
    );
  }
}
