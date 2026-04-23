import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1776962413554 implements MigrationInterface {
    name = 'Migration1776962413554'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "style_to_embellishment_map" ("created_by_id" uuid, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_by_id" uuid, "updated_at" TIMESTAMP DEFAULT now(), "deleted_at" TIMESTAMP, "id" SERIAL NOT NULL, "embellishment_id" integer NOT NULL, "style_id" uuid NOT NULL, CONSTRAINT "PK_56a2828cb7d2c09144df36bc6ad" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "style_to_embellishment_map" ADD CONSTRAINT "FK_cd10d81dfd74f6d2c51a4f3c624" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "style_to_embellishment_map" ADD CONSTRAINT "FK_9e5151a53076d2653d10b388083" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "style_to_embellishment_map" ADD CONSTRAINT "FK_749a88d94a54cdb9a5d0564ed2c" FOREIGN KEY ("style_id") REFERENCES "styles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "style_to_embellishment_map" ADD CONSTRAINT "FK_75b515c3c1cfd003ba8b2228290" FOREIGN KEY ("embellishment_id") REFERENCES "embellishment"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "style_to_embellishment_map" DROP CONSTRAINT "FK_75b515c3c1cfd003ba8b2228290"`);
        await queryRunner.query(`ALTER TABLE "style_to_embellishment_map" DROP CONSTRAINT "FK_749a88d94a54cdb9a5d0564ed2c"`);
        await queryRunner.query(`ALTER TABLE "style_to_embellishment_map" DROP CONSTRAINT "FK_9e5151a53076d2653d10b388083"`);
        await queryRunner.query(`ALTER TABLE "style_to_embellishment_map" DROP CONSTRAINT "FK_cd10d81dfd74f6d2c51a4f3c624"`);
        await queryRunner.query(`DROP TABLE "style_to_embellishment_map"`);
    }

}
