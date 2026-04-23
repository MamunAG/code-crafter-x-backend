import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1776957395855 implements MigrationInterface {
    name = 'Migration1776957395855'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "currency" ("created_by_id" uuid, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_by_id" uuid, "updated_at" TIMESTAMP DEFAULT now(), "deleted_at" TIMESTAMP, "id" SERIAL NOT NULL, "currencyname" character varying NOT NULL, "currencycode" character varying NOT NULL, "rate" double precision NOT NULL, "symbol" character varying NOT NULL, "is_default" boolean NOT NULL DEFAULT false, "is_active" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_3cda65c731a6264f0e444cc9b91" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "currency" ADD CONSTRAINT "FK_a42fa83f82790badd0c67f9c0c1" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "currency" ADD CONSTRAINT "FK_8692c2116c73441f68e127732f0" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "currency" DROP CONSTRAINT "FK_8692c2116c73441f68e127732f0"`);
        await queryRunner.query(`ALTER TABLE "currency" DROP CONSTRAINT "FK_a42fa83f82790badd0c67f9c0c1"`);
        await queryRunner.query(`DROP TABLE "currency"`);
    }

}
