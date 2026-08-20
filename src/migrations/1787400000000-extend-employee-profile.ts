import type { MigrationInterface, QueryRunner } from 'typeorm';

export class ExtendEmployeeProfile1787400000000 implements MigrationInterface {
  name = 'ExtendEmployeeProfile1787400000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "employees" ADD "profile_data" text');
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "employees" DROP COLUMN "profile_data"');
  }
}
