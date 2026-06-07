import { MigrationInterface, QueryRunner } from "typeorm";

export class FirstMigration1779804410446 implements MigrationInterface {
    name = 'FirstMigration1779804410446'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "fabric_costing" DROP CONSTRAINT "FK_78fa99ba8a94492007075bee436"`);
        await queryRunner.query(`ALTER TABLE "fabric_costing" DROP COLUMN "style_id"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "fabric_costing" ADD "style_id" uuid`);
        await queryRunner.query(`ALTER TABLE "fabric_costing" ADD CONSTRAINT "FK_78fa99ba8a94492007075bee436" FOREIGN KEY ("style_id") REFERENCES "styles"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

}
