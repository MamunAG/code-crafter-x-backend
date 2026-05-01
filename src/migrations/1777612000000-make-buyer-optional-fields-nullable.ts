import { MigrationInterface, QueryRunner } from 'typeorm';

export class MakeBuyerOptionalFieldsNullable1777612000000 implements MigrationInterface {
  name = 'MakeBuyerOptionalFieldsNullable1777612000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "buyer" ALTER COLUMN "contact" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "buyer" ALTER COLUMN "email" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "buyer" ALTER COLUMN "country_id" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "buyer" ALTER COLUMN "address" DROP NOT NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`UPDATE "buyer" SET "contact" = '' WHERE "contact" IS NULL`);
    await queryRunner.query(`UPDATE "buyer" SET "email" = '' WHERE "email" IS NULL`);
    await queryRunner.query(`UPDATE "buyer" SET "address" = '' WHERE "address" IS NULL`);
    await queryRunner.query(`DELETE FROM "buyer" WHERE "country_id" IS NULL`);
    await queryRunner.query(`ALTER TABLE "buyer" ALTER COLUMN "address" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "buyer" ALTER COLUMN "country_id" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "buyer" ALTER COLUMN "email" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "buyer" ALTER COLUMN "contact" SET NOT NULL`);
  }
}
