import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1776960875403 implements MigrationInterface {
    name = 'Migration1776960875403'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "styles" ("created_by_id" uuid, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_by_id" uuid, "updated_at" TIMESTAMP DEFAULT now(), "deleted_at" TIMESTAMP, "id" SERIAL NOT NULL, "product_type" character varying(255), "buyer_id" uuid NOT NULL, "style_no" character varying(255) NOT NULL, "style_name" character varying(255), "item_type" character varying(255), "product_department" character varying(255), "cm_sewing" double precision NOT NULL DEFAULT '0', "currency_id" integer NOT NULL, "smv_sewing" double precision NOT NULL DEFAULT '0', "smv_sewing_side_seam" double precision NOT NULL DEFAULT '0', "smv_cutting" double precision NOT NULL DEFAULT '0', "smv_cutting_side_seam" integer NOT NULL DEFAULT '0', "smv_finishing" double precision NOT NULL DEFAULT '0', "image_id" integer, "remarks" text, "is_active" boolean NOT NULL DEFAULT true, "item_uom" character varying(100), "product_family" character varying(255), CONSTRAINT "PK_1f22d2e5045f508c5fce0eb6e86" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "styles" ADD CONSTRAINT "FK_0ecb7bb07bb56139de4e30e9620" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "styles" ADD CONSTRAINT "FK_0a251f5c0bfeea93239db1079d2" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "styles" ADD CONSTRAINT "FK_490d74bd0622561ab514ef2778e" FOREIGN KEY ("buyer_id") REFERENCES "buyer"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "styles" ADD CONSTRAINT "FK_a9366e2a4e85d28ccecd6b84e2f" FOREIGN KEY ("currency_id") REFERENCES "currency"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "styles" ADD CONSTRAINT "FK_2df19691f32e1177cd1d0593d83" FOREIGN KEY ("image_id") REFERENCES "files"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "styles" DROP CONSTRAINT "FK_2df19691f32e1177cd1d0593d83"`);
        await queryRunner.query(`ALTER TABLE "styles" DROP CONSTRAINT "FK_a9366e2a4e85d28ccecd6b84e2f"`);
        await queryRunner.query(`ALTER TABLE "styles" DROP CONSTRAINT "FK_490d74bd0622561ab514ef2778e"`);
        await queryRunner.query(`ALTER TABLE "styles" DROP CONSTRAINT "FK_0a251f5c0bfeea93239db1079d2"`);
        await queryRunner.query(`ALTER TABLE "styles" DROP CONSTRAINT "FK_0ecb7bb07bb56139de4e30e9620"`);
        await queryRunner.query(`DROP TABLE "styles"`);
    }

}
