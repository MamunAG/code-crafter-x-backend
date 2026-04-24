import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUserRecoveryEmail1776963000000 implements MigrationInterface {
    name = 'AddUserRecoveryEmail1776963000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "recovery_email" character varying`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_users_recovery_email_unique" ON "users" ("recovery_email") WHERE "recovery_email" IS NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "IDX_users_recovery_email_unique"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "recovery_email"`);
    }

}
