import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1776960981527 implements MigrationInterface {
    name = 'Migration1776960981527'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "styles" DROP CONSTRAINT "PK_1f22d2e5045f508c5fce0eb6e86"`);
        await queryRunner.query(`ALTER TABLE "styles" DROP COLUMN "id"`);
        await queryRunner.query(`ALTER TABLE "styles" ADD "id" uuid NOT NULL DEFAULT uuid_generate_v4()`);
        await queryRunner.query(`ALTER TABLE "styles" ADD CONSTRAINT "PK_1f22d2e5045f508c5fce0eb6e86" PRIMARY KEY ("id")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "styles" DROP CONSTRAINT "PK_1f22d2e5045f508c5fce0eb6e86"`);
        await queryRunner.query(`ALTER TABLE "styles" DROP COLUMN "id"`);
        await queryRunner.query(`ALTER TABLE "styles" ADD "id" SERIAL NOT NULL`);
        await queryRunner.query(`ALTER TABLE "styles" ADD CONSTRAINT "PK_1f22d2e5045f508c5fce0eb6e86" PRIMARY KEY ("id")`);
    }

}
