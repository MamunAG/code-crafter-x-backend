import { MigrationInterface, QueryRunner } from 'typeorm';

export class MakeOrganizationAddressContactOptional1776966000000 implements MigrationInterface {
  name = 'MakeOrganizationAddressContactOptional1776966000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "organization" ALTER COLUMN "address" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "organization" ALTER COLUMN "contact" DROP NOT NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "organization" ALTER COLUMN "contact" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "organization" ALTER COLUMN "address" SET NOT NULL`);
  }
}
