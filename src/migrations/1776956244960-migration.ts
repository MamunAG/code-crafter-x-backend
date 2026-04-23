import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1776956244960 implements MigrationInterface {
    name = 'Migration1776956244960'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "color" ADD "is_active" boolean NOT NULL DEFAULT true`);
        await queryRunner.query(`ALTER TABLE "size" ADD "is_active" boolean NOT NULL DEFAULT true`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "size" DROP COLUMN "is_active"`);
        await queryRunner.query(`ALTER TABLE "color" DROP COLUMN "is_active"`);
    }

}
