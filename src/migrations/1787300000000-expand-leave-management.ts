import { MigrationInterface, QueryRunner } from 'typeorm';

export class ExpandLeaveManagement1787300000000 implements MigrationInterface {
  name = 'ExpandLeaveManagement1787300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TYPE "public"."hr_leave_requests_status_enum" ADD VALUE IF NOT EXISTS 'RETURNED'`);
    await queryRunner.query(`ALTER TYPE "public"."hr_master_data_type_enum" ADD VALUE IF NOT EXISTS 'LEAVE_POLICY'`);
    await queryRunner.query(`ALTER TYPE "public"."hr_master_data_type_enum" ADD VALUE IF NOT EXISTS 'LEAVE_POLICY_ASSIGNMENT'`);
    await queryRunner.query(`ALTER TYPE "public"."hr_master_data_type_enum" ADD VALUE IF NOT EXISTS 'LEAVE_WORKFLOW'`);
    await queryRunner.query(`ALTER TYPE "public"."hr_master_data_type_enum" ADD VALUE IF NOT EXISTS 'LEAVE_WORKFLOW_ASSIGNMENT'`);
    await queryRunner.query(`ALTER TABLE "hr_leave_requests" ADD COLUMN IF NOT EXISTS "application_number" character varying(40)`);
    await queryRunner.query(`ALTER TABLE "hr_leave_requests" ADD COLUMN IF NOT EXISTS "duration_type" character varying(30) NOT NULL DEFAULT 'FULL_DAY'`);
    await queryRunner.query(`ALTER TABLE "hr_leave_requests" ADD COLUMN IF NOT EXISTS "contact_during_leave" character varying(255)`);
    await queryRunner.query(`ALTER TABLE "hr_leave_requests" ADD COLUMN IF NOT EXISTS "attachment_url" text`);
    await queryRunner.query(`ALTER TABLE "hr_leave_requests" ADD COLUMN IF NOT EXISTS "day_breakdown" jsonb NOT NULL DEFAULT '[]'::jsonb`);
    await queryRunner.query(`ALTER TABLE "hr_leave_balances" ADD COLUMN IF NOT EXISTS "carried_forward" numeric(10,2) NOT NULL DEFAULT 0`);
    await queryRunner.query(`ALTER TABLE "hr_leave_balances" ADD COLUMN IF NOT EXISTS "expired" numeric(10,2) NOT NULL DEFAULT 0`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_hr_leave_request_application_number" ON "hr_leave_requests" ("organization_id", "application_number")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_hr_leave_request_application_number"`);
    await queryRunner.query(`ALTER TABLE "hr_leave_balances" DROP COLUMN IF EXISTS "expired"`);
    await queryRunner.query(`ALTER TABLE "hr_leave_balances" DROP COLUMN IF EXISTS "carried_forward"`);
    await queryRunner.query(`ALTER TABLE "hr_leave_requests" DROP COLUMN IF EXISTS "day_breakdown"`);
    await queryRunner.query(`ALTER TABLE "hr_leave_requests" DROP COLUMN IF EXISTS "attachment_url"`);
    await queryRunner.query(`ALTER TABLE "hr_leave_requests" DROP COLUMN IF EXISTS "contact_during_leave"`);
    await queryRunner.query(`ALTER TABLE "hr_leave_requests" DROP COLUMN IF EXISTS "duration_type"`);
    await queryRunner.query(`ALTER TABLE "hr_leave_requests" DROP COLUMN IF EXISTS "application_number"`);
  }
}
