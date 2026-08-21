import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAttendancePullIntegrations1787600000000 implements MigrationInterface {
  name = 'AddAttendancePullIntegrations1787600000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "hr_attendance_pull_integrations" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "organization_id" uuid NOT NULL,
        "created_by_id" uuid,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_by_id" uuid,
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "row_version" integer NOT NULL DEFAULT 1,
        "name" character varying(160) NOT NULL,
        "source" character varying(120) NOT NULL,
        "endpoint_url" text NOT NULL,
        "method" character varying(10) NOT NULL,
        "request_config" text NOT NULL,
        "response_items_path" character varying(500),
        "mappings" jsonb NOT NULL DEFAULT '[]',
        "direction_map" jsonb NOT NULL DEFAULT '{}',
        "cursor_response_path" character varying(500),
        "last_cursor" text,
        "schedule_interval_minutes" integer,
        "is_active" boolean NOT NULL DEFAULT false,
        "next_run_at" TIMESTAMP WITH TIME ZONE,
        "last_run_at" TIMESTAMP WITH TIME ZONE,
        "last_success_at" TIMESTAMP WITH TIME ZONE,
        "last_status" character varying(30),
        "last_error" text,
        "last_result" jsonb,
        "sync_locked_until" TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "PK_hr_attendance_pull_integrations" PRIMARY KEY ("id"),
        CONSTRAINT "uq_hr_attendance_pull_source" UNIQUE ("organization_id", "source"),
        CONSTRAINT "FK_hr_attendance_pull_organization" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      'CREATE INDEX "idx_hr_attendance_pull_due" ON "hr_attendance_pull_integrations" ("is_active", "next_run_at")',
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX "idx_hr_attendance_pull_due"');
    await queryRunner.query('DROP TABLE "hr_attendance_pull_integrations"');
  }
}
