import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1776961805898 implements MigrationInterface {
    name = 'Migration1776961805898'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "style_to_color_map" DROP COLUMN "buyer_id"`);
        await queryRunner.query(`ALTER TABLE "style_to_color_map" DROP COLUMN "style_no"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "style_to_color_map" ADD "style_no" character varying(255) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "style_to_color_map" ADD "buyer_id" uuid NOT NULL`);
    }

}
