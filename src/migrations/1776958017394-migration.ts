import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1776958017394 implements MigrationInterface {
    name = 'Migration1776958017394'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "uom" ("created_by_id" uuid, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_by_id" uuid, "updated_at" TIMESTAMP DEFAULT now(), "deleted_at" TIMESTAMP, "id" SERIAL NOT NULL, "name" character varying NOT NULL, "short_name" character varying NOT NULL, "is_active" character varying(10) NOT NULL DEFAULT 'Y', CONSTRAINT "PK_87729daf4a43ad4efdbdef69ff9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "uom" ADD CONSTRAINT "FK_22a21c0de2f25b46f5ca09cf20f" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "uom" ADD CONSTRAINT "FK_9fde0cb346e4a4725d29cc00648" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "uom" DROP CONSTRAINT "FK_9fde0cb346e4a4725d29cc00648"`);
        await queryRunner.query(`ALTER TABLE "uom" DROP CONSTRAINT "FK_22a21c0de2f25b46f5ca09cf20f"`);
        await queryRunner.query(`DROP TABLE "uom"`);
    }

}
