import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1776954988701 implements MigrationInterface {
    name = 'Migration1776954988701'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "color" DROP COLUMN "color_commercial_name"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "color" ADD "color_commercial_name" character varying`);
    }

}
