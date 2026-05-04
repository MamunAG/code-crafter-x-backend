import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1777876753462 implements MigrationInterface {
    name = 'Migration1777876753462'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "departments" ("created_by_id" uuid, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_by_id" uuid, "updated_at" TIMESTAMP DEFAULT now(), "deleted_at" TIMESTAMP, "deleted_by_id" uuid, "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "organization_id" uuid NOT NULL, "department_name" character varying(255) NOT NULL, "description" text, "is_active" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_839517a681a86bb84cbcc6a1e9d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "departments" ADD CONSTRAINT "FK_c92e8cfee06c8e18abd172ea9e1" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "departments" ADD CONSTRAINT "FK_d149ad13b484d568edf6171131f" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "departments" ADD CONSTRAINT "FK_5e5b364bfe4e30683d072b125d3" FOREIGN KEY ("deleted_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "departments" ADD CONSTRAINT "FK_71070628c130f2c9cd3cd5f082f" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "departments" DROP CONSTRAINT "FK_71070628c130f2c9cd3cd5f082f"`);
        await queryRunner.query(`ALTER TABLE "departments" DROP CONSTRAINT "FK_5e5b364bfe4e30683d072b125d3"`);
        await queryRunner.query(`ALTER TABLE "departments" DROP CONSTRAINT "FK_d149ad13b484d568edf6171131f"`);
        await queryRunner.query(`ALTER TABLE "departments" DROP CONSTRAINT "FK_c92e8cfee06c8e18abd172ea9e1"`);
        await queryRunner.query(`DROP TABLE "departments"`);
    }

}
