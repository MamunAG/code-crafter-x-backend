import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1777772156997 implements MigrationInterface {
    name = 'Migration1777772156997'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "factory" ("created_by_id" uuid, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_by_id" uuid, "updated_at" TIMESTAMP DEFAULT now(), "deleted_at" TIMESTAMP, "deleted_by_id" uuid, "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "display_name" character varying NOT NULL, "code" character varying, "contact" character varying, "email" character varying, "organization_id" uuid, "address" character varying, "remarks" text, "is_active" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_1372e5a7d114a3fa80736ba66bb" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "factory" ADD CONSTRAINT "FK_c0e54466eb0920eab0a39b833a6" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "factory" ADD CONSTRAINT "FK_8959582eb1954b388ed6d3ef23a" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "factory" ADD CONSTRAINT "FK_b63dad5ac4839a7763557779b15" FOREIGN KEY ("deleted_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "factory" ADD CONSTRAINT "FK_dbec80b255833db6be62d5ec639" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "factory" DROP CONSTRAINT "FK_dbec80b255833db6be62d5ec639"`);
        await queryRunner.query(`ALTER TABLE "factory" DROP CONSTRAINT "FK_b63dad5ac4839a7763557779b15"`);
        await queryRunner.query(`ALTER TABLE "factory" DROP CONSTRAINT "FK_8959582eb1954b388ed6d3ef23a"`);
        await queryRunner.query(`ALTER TABLE "factory" DROP CONSTRAINT "FK_c0e54466eb0920eab0a39b833a6"`);
        await queryRunner.query(`DROP TABLE "factory"`);
    }

}
