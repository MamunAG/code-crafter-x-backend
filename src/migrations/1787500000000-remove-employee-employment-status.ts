import type { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveEmployeeEmploymentStatus1787500000000 implements MigrationInterface {
  name = 'RemoveEmployeeEmploymentStatus1787500000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "employees" DROP COLUMN "employment_status"');
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "employees" ADD "employment_status" character varying(30) NOT NULL DEFAULT \'ACTIVE\'',
    );
    await queryRunner.query(
      'UPDATE "employees" SET "employment_status" = \'INACTIVE\' WHERE "is_active" = false',
    );
  }
}
