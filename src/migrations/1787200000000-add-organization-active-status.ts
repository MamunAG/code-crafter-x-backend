import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOrganizationActiveStatus1787200000000 implements MigrationInterface {
  name = 'AddOrganizationActiveStatus1787200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "organization"
      ADD COLUMN IF NOT EXISTS "is_active" boolean NOT NULL DEFAULT true
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "organization"
      DROP COLUMN IF EXISTS "is_active"
    `);
  }
}
