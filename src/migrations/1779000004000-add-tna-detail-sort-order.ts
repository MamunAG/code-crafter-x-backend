import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTnaDetailSortOrder1779000004000 implements MigrationInterface {
  name = 'AddTnaDetailSortOrder1779000004000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "tna_details" ADD "sort_order" integer`);
    await queryRunner.query(`
      WITH ranked_details AS (
        SELECT
          "id",
          ROW_NUMBER() OVER (
            PARTITION BY "tna_id"
            ORDER BY "execution_date" ASC, "id" ASC
          ) AS "row_number"
        FROM "tna_details"
      )
      UPDATE "tna_details"
      SET "sort_order" = ranked_details."row_number"
      FROM ranked_details
      WHERE "tna_details"."id" = ranked_details."id"
    `);
    await queryRunner.query(`ALTER TABLE "tna_details" ALTER COLUMN "sort_order" SET DEFAULT 0`);
    await queryRunner.query(`ALTER TABLE "tna_details" ALTER COLUMN "sort_order" SET NOT NULL`);
    await queryRunner.query(`CREATE INDEX "IDX_tna_details_tna_sort_order" ON "tna_details" ("tna_id", "sort_order")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_tna_details_tna_sort_order"`);
    await queryRunner.query(`ALTER TABLE "tna_details" DROP COLUMN "sort_order"`);
  }
}
