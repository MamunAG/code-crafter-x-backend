import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1776962068999 implements MigrationInterface {
    name = 'Migration1776962068999'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "style_to_size_map" ("created_by_id" uuid, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_by_id" uuid, "updated_at" TIMESTAMP DEFAULT now(), "deleted_at" TIMESTAMP, "id" SERIAL NOT NULL, "size_id" integer NOT NULL, "style_id" uuid NOT NULL, CONSTRAINT "PK_bc6df015c0c123b64ab76343b9d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "style_to_size_map" ADD CONSTRAINT "FK_b01077d9346f75dc9c0edfb06b6" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "style_to_size_map" ADD CONSTRAINT "FK_3b9b1fa449427f1bc24eeb1da39" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "style_to_size_map" ADD CONSTRAINT "FK_091170c2c26ed3b20cd53570eb1" FOREIGN KEY ("style_id") REFERENCES "styles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "style_to_size_map" ADD CONSTRAINT "FK_434ee01f36da0608c838d7d0287" FOREIGN KEY ("size_id") REFERENCES "size"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "style_to_size_map" DROP CONSTRAINT "FK_434ee01f36da0608c838d7d0287"`);
        await queryRunner.query(`ALTER TABLE "style_to_size_map" DROP CONSTRAINT "FK_091170c2c26ed3b20cd53570eb1"`);
        await queryRunner.query(`ALTER TABLE "style_to_size_map" DROP CONSTRAINT "FK_3b9b1fa449427f1bc24eeb1da39"`);
        await queryRunner.query(`ALTER TABLE "style_to_size_map" DROP CONSTRAINT "FK_b01077d9346f75dc9c0edfb06b6"`);
        await queryRunner.query(`DROP TABLE "style_to_size_map"`);
    }

}
