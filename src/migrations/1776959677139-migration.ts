import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1776959677139 implements MigrationInterface {
    name = 'Migration1776959677139'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "country" ("created_by_id" uuid, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_by_id" uuid, "updated_at" TIMESTAMP DEFAULT now(), "deleted_at" TIMESTAMP, "id" SERIAL NOT NULL, "name" character varying NOT NULL, "is_active" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_bf6e37c231c4f4ea56dcd887269" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "country" ADD CONSTRAINT "FK_d4b6d035a533a65d02ba229d3bf" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "country" ADD CONSTRAINT "FK_df18c9b1ef90856f1368d92b420" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "country" DROP CONSTRAINT "FK_df18c9b1ef90856f1368d92b420"`);
        await queryRunner.query(`ALTER TABLE "country" DROP CONSTRAINT "FK_d4b6d035a533a65d02ba229d3bf"`);
        await queryRunner.query(`DROP TABLE "country"`);
    }

}
