import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1776956114659 implements MigrationInterface {
    name = 'Migration1776956114659'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "size" ("created_by_id" uuid, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_by_id" uuid, "updated_at" TIMESTAMP DEFAULT now(), "deleted_at" TIMESTAMP, "id" SERIAL NOT NULL, "size_name" character varying NOT NULL, CONSTRAINT "PK_66e3a0111d969aa0e5f73855c7a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "size" ADD CONSTRAINT "FK_b7a59bfbab95adf9d1b9d4e6ebf" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "size" ADD CONSTRAINT "FK_1efd3db06638ac517964f131c34" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "size" DROP CONSTRAINT "FK_1efd3db06638ac517964f131c34"`);
        await queryRunner.query(`ALTER TABLE "size" DROP CONSTRAINT "FK_b7a59bfbab95adf9d1b9d4e6ebf"`);
        await queryRunner.query(`DROP TABLE "size"`);
    }

}
