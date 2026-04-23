import { MigrationInterface, QueryRunner } from "typeorm";

export class UserUp1776929287731 implements MigrationInterface {
    name = 'UserUp1776929287731'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_a367444399d0404c15d7dffdb02"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "file_id"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "display_name"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "language"`);
        await queryRunner.query(`DROP TYPE "code_crafter_x"."users_language_enum"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "is_delete_account"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "account_delete_at"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "is_show_your_birth_date"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "is_show_your_location_on_profile"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "is_disable_private_chats"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "is_Save_your_activity_on_this_device"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "isSubscribedUser"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "is_moderation_user"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "profile_pic_id" integer`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "created_by"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "created_by" uuid`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "updated_by"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "updated_by" uuid`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_68a7fe0ccca390885fe1b4f12b7" FOREIGN KEY ("profile_pic_id") REFERENCES "files"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_f32b1cb14a9920477bcfd63df2c" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_b75c92ef36f432fe68ec300a7d4" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_b75c92ef36f432fe68ec300a7d4"`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_f32b1cb14a9920477bcfd63df2c"`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_68a7fe0ccca390885fe1b4f12b7"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "updated_by"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "updated_by" character varying`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "created_by"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "created_by" character varying`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "profile_pic_id"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "is_moderation_user" boolean DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "users" ADD "isSubscribedUser" boolean DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "users" ADD "is_Save_your_activity_on_this_device" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "users" ADD "is_disable_private_chats" boolean NOT NULL DEFAULT true`);
        await queryRunner.query(`ALTER TABLE "users" ADD "is_show_your_location_on_profile" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "users" ADD "is_show_your_birth_date" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "users" ADD "account_delete_at" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "users" ADD "is_delete_account" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`CREATE TYPE "code_crafter_x"."users_language_enum" AS ENUM('Arabic', 'English')`);
        await queryRunner.query(`ALTER TABLE "users" ADD "language" "code_crafter_x"."users_language_enum" DEFAULT 'English'`);
        await queryRunner.query(`ALTER TABLE "users" ADD "display_name" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "users" ADD "file_id" integer`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_a367444399d0404c15d7dffdb02" FOREIGN KEY ("file_id") REFERENCES "files"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
