import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1777831970104 implements MigrationInterface {
    name = 'Migration1777831970104'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "factory" DROP CONSTRAINT "FK_factory_image_id_files_id"`);
        await queryRunner.query(`CREATE TABLE "hr-designations" ("created_by_id" uuid, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_by_id" uuid, "updated_at" TIMESTAMP DEFAULT now(), "deleted_at" TIMESTAMP, "deleted_by_id" uuid, "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "organization_id" uuid NOT NULL, "designation_name" character varying(255) NOT NULL, "description" text, "is_active" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_3bba291f76e3886714946b0bcda" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "factory" ADD CONSTRAINT "FK_3accde3cbaa577c6c262a3cea5c" FOREIGN KEY ("image_id") REFERENCES "files"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "hr-designations" ADD CONSTRAINT "FK_c3162a6c4e096759bc07c5ccf83" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "hr-designations" ADD CONSTRAINT "FK_dc54e5ed0ab4295f0c7f3a3a1b7" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "hr-designations" ADD CONSTRAINT "FK_0d49692baefa8b5ce93be6ac150" FOREIGN KEY ("deleted_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "hr-designations" ADD CONSTRAINT "FK_12ae7790717f5a3deec859d1ebb" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "hr-designations" DROP CONSTRAINT "FK_12ae7790717f5a3deec859d1ebb"`);
        await queryRunner.query(`ALTER TABLE "hr-designations" DROP CONSTRAINT "FK_0d49692baefa8b5ce93be6ac150"`);
        await queryRunner.query(`ALTER TABLE "hr-designations" DROP CONSTRAINT "FK_dc54e5ed0ab4295f0c7f3a3a1b7"`);
        await queryRunner.query(`ALTER TABLE "hr-designations" DROP CONSTRAINT "FK_c3162a6c4e096759bc07c5ccf83"`);
        await queryRunner.query(`ALTER TABLE "factory" DROP CONSTRAINT "FK_3accde3cbaa577c6c262a3cea5c"`);
        await queryRunner.query(`DROP TABLE "hr-designations"`);
        await queryRunner.query(`ALTER TABLE "factory" ADD CONSTRAINT "FK_factory_image_id_files_id" FOREIGN KEY ("image_id") REFERENCES "files"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

}
