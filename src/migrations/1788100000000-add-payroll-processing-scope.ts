import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPayrollProcessingScope1788100000000 implements MigrationInterface {
  name = 'AddPayrollProcessingScope1788100000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE "public"."hr_payroll_runs_processing_mode_enum" AS ENUM('INDIVIDUAL', 'BULK')`);
    await queryRunner.query(`ALTER TABLE "hr_payroll_runs" ADD "processing_mode" "public"."hr_payroll_runs_processing_mode_enum" NOT NULL DEFAULT 'BULK'`);
    await queryRunner.query(`ALTER TABLE "hr_payroll_runs" ADD "selection_criteria" jsonb NOT NULL DEFAULT '{}'::jsonb`);
    await queryRunner.query(`ALTER TABLE "hr_payroll_runs" ADD "formula_inputs" jsonb NOT NULL DEFAULT '{}'::jsonb`);
    await queryRunner.query(`ALTER TABLE "hr_payroll_runs" DROP CONSTRAINT "uq_hr_payroll_run_scope"`);
    await queryRunner.query(`ALTER TABLE "hr_payroll_runs" ADD CONSTRAINT "uq_hr_payroll_run_scope" UNIQUE ("organization_id", "factory_id", "pay_group_id", "period_start", "period_end", "run_type", "sequence", "processing_mode", "selection_criteria")`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "hr_payroll_runs" DROP CONSTRAINT "uq_hr_payroll_run_scope"`);
    await queryRunner.query(`ALTER TABLE "hr_payroll_runs" ADD CONSTRAINT "uq_hr_payroll_run_scope" UNIQUE ("organization_id", "factory_id", "pay_group_id", "period_start", "period_end", "run_type", "sequence")`);
    await queryRunner.query(`ALTER TABLE "hr_payroll_runs" DROP COLUMN "formula_inputs"`);
    await queryRunner.query(`ALTER TABLE "hr_payroll_runs" DROP COLUMN "selection_criteria"`);
    await queryRunner.query(`ALTER TABLE "hr_payroll_runs" DROP COLUMN "processing_mode"`);
    await queryRunner.query(`DROP TYPE "public"."hr_payroll_runs_processing_mode_enum"`);
  }
}
