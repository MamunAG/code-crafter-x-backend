import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1776959867574 implements MigrationInterface {
    name = 'Migration1776959867574'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "buyer" ("created_by_id" uuid, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_by_id" uuid, "updated_at" TIMESTAMP DEFAULT now(), "deleted_at" TIMESTAMP, "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "display_name" character varying NOT NULL, "contact" character varying NOT NULL, "email" character varying NOT NULL, "address" character varying NOT NULL, "is_active" character varying(10) NOT NULL DEFAULT 'Y', "remarks" text, "country_id" integer NOT NULL, CONSTRAINT "UQ_7911d7b9e729513dec55983fc50" UNIQUE ("email"), CONSTRAINT "PK_0480fc3c7289846a31b8e1bc503" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "buyer" ADD CONSTRAINT "FK_5f589b57adee48f2e61742a1fcb" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "buyer" ADD CONSTRAINT "FK_92641e04ff92b756a23be1ce277" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "buyer" ADD CONSTRAINT "FK_84ca5aa0a0a24dbca0a83648b28" FOREIGN KEY ("country_id") REFERENCES "country"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "buyer" DROP CONSTRAINT "FK_84ca5aa0a0a24dbca0a83648b28"`);
        await queryRunner.query(`ALTER TABLE "buyer" DROP CONSTRAINT "FK_92641e04ff92b756a23be1ce277"`);
        await queryRunner.query(`ALTER TABLE "buyer" DROP CONSTRAINT "FK_5f589b57adee48f2e61742a1fcb"`);
        await queryRunner.query(`DROP TABLE "buyer"`);
    }

}
