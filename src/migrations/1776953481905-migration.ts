import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1776953481905 implements MigrationInterface {
    name = 'Migration1776953481905'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_b75c92ef36f432fe68ec300a7d4"`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_f32b1cb14a9920477bcfd63df2c"`);
        await queryRunner.query(`ALTER TABLE "contact" DROP CONSTRAINT "FK_33d4fc93803e7192e150216fffb"`);
        await queryRunner.query(`CREATE TABLE "color" ("created_by_id" uuid, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_by_id" uuid, "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "id" SERIAL NOT NULL, "color_name" character varying NOT NULL, "color_display_name" character varying, "color_description" text, "color_commercial_name" character varying, CONSTRAINT "PK_d15e531d60a550fbf23e1832343" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "created_by"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "updated_by"`);
        await queryRunner.query(`ALTER TABLE "contact" DROP COLUMN "user_id"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "created_by_id" uuid`);
        await queryRunner.query(`ALTER TABLE "users" ADD "updated_by_id" uuid`);
        await queryRunner.query(`ALTER TABLE "contact" ADD "created_by_id" uuid`);
        await queryRunner.query(`ALTER TABLE "contact" ADD "updated_by_id" uuid`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_1bbd34899b8e74ef2a7f3212806" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_80e310e761f458f272c20ea6add" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "contact" ADD CONSTRAINT "FK_316c25cbe80d0fbc05884a9337b" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "contact" ADD CONSTRAINT "FK_90310dbe361d29035cc6ab8303c" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "color" ADD CONSTRAINT "FK_8f937b96ee18c1e12f28b7ce13e" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "color" ADD CONSTRAINT "FK_496b0608b9460f394a16222c99e" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "color" DROP CONSTRAINT "FK_496b0608b9460f394a16222c99e"`);
        await queryRunner.query(`ALTER TABLE "color" DROP CONSTRAINT "FK_8f937b96ee18c1e12f28b7ce13e"`);
        await queryRunner.query(`ALTER TABLE "contact" DROP CONSTRAINT "FK_90310dbe361d29035cc6ab8303c"`);
        await queryRunner.query(`ALTER TABLE "contact" DROP CONSTRAINT "FK_316c25cbe80d0fbc05884a9337b"`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_80e310e761f458f272c20ea6add"`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_1bbd34899b8e74ef2a7f3212806"`);
        await queryRunner.query(`ALTER TABLE "contact" DROP COLUMN "updated_by_id"`);
        await queryRunner.query(`ALTER TABLE "contact" DROP COLUMN "created_by_id"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "updated_by_id"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "created_by_id"`);
        await queryRunner.query(`ALTER TABLE "contact" ADD "user_id" uuid NOT NULL`);
        await queryRunner.query(`ALTER TABLE "users" ADD "updated_by" uuid`);
        await queryRunner.query(`ALTER TABLE "users" ADD "created_by" uuid`);
        await queryRunner.query(`DROP TABLE "color"`);
        await queryRunner.query(`ALTER TABLE "contact" ADD CONSTRAINT "FK_33d4fc93803e7192e150216fffb" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_f32b1cb14a9920477bcfd63df2c" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_b75c92ef36f432fe68ec300a7d4" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
