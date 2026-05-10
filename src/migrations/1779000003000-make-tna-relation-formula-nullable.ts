import { MigrationInterface, QueryRunner } from 'typeorm';

export class MakeTnaRelationFormulaNullable1779000003000 implements MigrationInterface {
  name = 'MakeTnaRelationFormulaNullable1779000003000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "tna_details" ALTER COLUMN "relation_formula" DROP NOT NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`UPDATE "tna_details" SET "relation_formula" = '' WHERE "relation_formula" IS NULL`);
    await queryRunner.query(`ALTER TABLE "tna_details" ALTER COLUMN "relation_formula" SET NOT NULL`);
  }
}
