import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTnaDetailRevisions1779000005000 implements MigrationInterface {
  name = 'AddTnaDetailRevisions1779000005000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "tna_detail_revisions" ("created_by_id" uuid, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_by_id" uuid, "updated_at" TIMESTAMP DEFAULT now(), "deleted_at" TIMESTAMP, "deleted_by_id" uuid, "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tna_detail_id" uuid NOT NULL, "previous_execution_date" date NOT NULL, "new_execution_date" date NOT NULL, "note" text, CONSTRAINT "PK_tna_detail_revisions" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_tna_detail_revisions_detail_created" ON "tna_detail_revisions" ("tna_detail_id", "created_at")`);
    await queryRunner.query(`ALTER TABLE "tna_detail_revisions" ADD CONSTRAINT "FK_tna_detail_revisions_tna_detail" FOREIGN KEY ("tna_detail_id") REFERENCES "tna_details"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "tna_detail_revisions" ADD CONSTRAINT "FK_tna_detail_revisions_created_by" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "tna_detail_revisions" ADD CONSTRAINT "FK_tna_detail_revisions_updated_by" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "tna_detail_revisions" ADD CONSTRAINT "FK_tna_detail_revisions_deleted_by" FOREIGN KEY ("deleted_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "tna_detail_revisions" DROP CONSTRAINT "FK_tna_detail_revisions_deleted_by"`);
    await queryRunner.query(`ALTER TABLE "tna_detail_revisions" DROP CONSTRAINT "FK_tna_detail_revisions_updated_by"`);
    await queryRunner.query(`ALTER TABLE "tna_detail_revisions" DROP CONSTRAINT "FK_tna_detail_revisions_created_by"`);
    await queryRunner.query(`ALTER TABLE "tna_detail_revisions" DROP CONSTRAINT "FK_tna_detail_revisions_tna_detail"`);
    await queryRunner.query(`DROP INDEX "IDX_tna_detail_revisions_detail_created"`);
    await queryRunner.query(`DROP TABLE "tna_detail_revisions"`);
  }
}
