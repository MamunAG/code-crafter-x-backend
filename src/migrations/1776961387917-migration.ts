import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1776961387917 implements MigrationInterface {
    name = 'Migration1776961387917'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "style_to_color_map" ("created_by_id" uuid, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_by_id" uuid, "updated_at" TIMESTAMP DEFAULT now(), "deleted_at" TIMESTAMP, "id" SERIAL NOT NULL, "buyer_id" uuid NOT NULL, "style_no" character varying(255) NOT NULL, "color_id" integer NOT NULL, "style_id" uuid NOT NULL, CONSTRAINT "PK_376e0f23923a1046f5dd08b8239" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "style_to_color_map" ADD CONSTRAINT "FK_f66e375124539cd7b372e0bd5aa" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "style_to_color_map" ADD CONSTRAINT "FK_e63294eddf98c5e1e4a604f90d0" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "style_to_color_map" ADD CONSTRAINT "FK_c6b5ada1dc656a91166003e0bd1" FOREIGN KEY ("style_id") REFERENCES "styles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "style_to_color_map" ADD CONSTRAINT "FK_047187f223e5db4dace2c03a7f3" FOREIGN KEY ("color_id") REFERENCES "color"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "style_to_color_map" DROP CONSTRAINT "FK_047187f223e5db4dace2c03a7f3"`);
        await queryRunner.query(`ALTER TABLE "style_to_color_map" DROP CONSTRAINT "FK_c6b5ada1dc656a91166003e0bd1"`);
        await queryRunner.query(`ALTER TABLE "style_to_color_map" DROP CONSTRAINT "FK_e63294eddf98c5e1e4a604f90d0"`);
        await queryRunner.query(`ALTER TABLE "style_to_color_map" DROP CONSTRAINT "FK_f66e375124539cd7b372e0bd5aa"`);
        await queryRunner.query(`DROP TABLE "style_to_color_map"`);
    }

}
