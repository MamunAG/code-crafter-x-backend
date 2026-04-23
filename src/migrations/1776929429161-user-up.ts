import { MigrationInterface, QueryRunner } from "typeorm";

export class UserUp1776929429161 implements MigrationInterface {
    name = 'UserUp1776929429161'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "is_email_verified" boolean NOT NULL DEFAULT true`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "is_email_verified"`);
    }

}
