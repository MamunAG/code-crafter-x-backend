import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOrganization1776964000000 implements MigrationInterface {
  name = 'AddOrganization1776964000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE "organization" ("created_by_id" uuid, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_by_id" uuid, "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "deleted_by_id" uuid, "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "address" character varying NOT NULL, "contact" character varying NOT NULL, CONSTRAINT "PK_1d9b6d5b59b6cc4b7f2a5f1f7f5" PRIMARY KEY ("id"))`);
    await queryRunner.query(`ALTER TABLE "organization" ADD CONSTRAINT "FK_organization_created_by_id_users" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "organization" ADD CONSTRAINT "FK_organization_updated_by_id_users" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "organization" ADD CONSTRAINT "FK_organization_deleted_by_id_users" FOREIGN KEY ("deleted_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "organization" DROP CONSTRAINT "FK_organization_deleted_by_id_users"`);
    await queryRunner.query(`ALTER TABLE "organization" DROP CONSTRAINT "FK_organization_updated_by_id_users"`);
    await queryRunner.query(`ALTER TABLE "organization" DROP CONSTRAINT "FK_organization_created_by_id_users"`);
    await queryRunner.query(`DROP TABLE "organization"`);
  }
}
