import { MigrationInterface, QueryRunner } from "typeorm";

export class UserUpEmailVer1776951675619 implements MigrationInterface {
    name = 'UserUpEmailVer1776951675619'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "status" SET DEFAULT 'inactive'`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "is_email_verified" SET DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "is_email_verified" SET DEFAULT true`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "status" SET DEFAULT 'active'`);
    }

}
