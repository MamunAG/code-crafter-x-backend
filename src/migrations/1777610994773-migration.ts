import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1777610994773 implements MigrationInterface {
    name = 'Migration1777610994773'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "uom" DROP COLUMN "is_active"`);
        await queryRunner.query(`ALTER TABLE "uom" ADD "is_active" boolean NOT NULL DEFAULT true`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "uom" DROP COLUMN "is_active"`);
        await queryRunner.query(`ALTER TABLE "uom" ADD "is_active" character varying(10) NOT NULL DEFAULT 'Y'`);
    }

}
