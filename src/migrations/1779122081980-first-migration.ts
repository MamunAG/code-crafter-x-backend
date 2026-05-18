import { MigrationInterface, QueryRunner } from "typeorm";

export class FirstMigration1779122081980 implements MigrationInterface {
    name = 'FirstMigration1779122081980'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tna_detail_revisions" DROP CONSTRAINT "FK_tna_detail_revisions_created_by"`);
        await queryRunner.query(`ALTER TABLE "tna_detail_revisions" DROP CONSTRAINT "FK_tna_detail_revisions_deleted_by"`);
        await queryRunner.query(`ALTER TABLE "tna_detail_revisions" DROP CONSTRAINT "FK_tna_detail_revisions_tna_detail"`);
        await queryRunner.query(`ALTER TABLE "tna_detail_revisions" DROP CONSTRAINT "FK_tna_detail_revisions_updated_by"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_tna_detail_revisions_detail_created"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_tna_details_tna_sort_order"`);
        await queryRunner.query(`ALTER TABLE "tna_detail_revisions" ADD CONSTRAINT "FK_74bd5510b85ae3f935d0c93131b" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tna_detail_revisions" ADD CONSTRAINT "FK_43f7a7e87effb398b3984d5b760" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tna_detail_revisions" ADD CONSTRAINT "FK_ed30b1d069bde0d75937699b4b3" FOREIGN KEY ("deleted_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tna_detail_revisions" ADD CONSTRAINT "FK_c02d7dbd22c331fb2caba628d75" FOREIGN KEY ("tna_detail_id") REFERENCES "tna_details"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tna_detail_revisions" DROP CONSTRAINT "FK_c02d7dbd22c331fb2caba628d75"`);
        await queryRunner.query(`ALTER TABLE "tna_detail_revisions" DROP CONSTRAINT "FK_ed30b1d069bde0d75937699b4b3"`);
        await queryRunner.query(`ALTER TABLE "tna_detail_revisions" DROP CONSTRAINT "FK_43f7a7e87effb398b3984d5b760"`);
        await queryRunner.query(`ALTER TABLE "tna_detail_revisions" DROP CONSTRAINT "FK_74bd5510b85ae3f935d0c93131b"`);
        await queryRunner.query(`CREATE INDEX "IDX_tna_details_tna_sort_order" ON "tna_details" ("sort_order", "tna_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_tna_detail_revisions_detail_created" ON "tna_detail_revisions" ("created_at", "tna_detail_id") `);
        await queryRunner.query(`ALTER TABLE "tna_detail_revisions" ADD CONSTRAINT "FK_tna_detail_revisions_updated_by" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tna_detail_revisions" ADD CONSTRAINT "FK_tna_detail_revisions_tna_detail" FOREIGN KEY ("tna_detail_id") REFERENCES "tna_details"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tna_detail_revisions" ADD CONSTRAINT "FK_tna_detail_revisions_deleted_by" FOREIGN KEY ("deleted_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tna_detail_revisions" ADD CONSTRAINT "FK_tna_detail_revisions_created_by" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
