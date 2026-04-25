import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserToOranizationMap1776965000000 implements MigrationInterface {
  name = 'AddUserToOranizationMap1776965000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE "user_to_oranization_map" ("created_by_id" uuid, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_by_id" uuid, "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "deleted_by_id" uuid, "user_id" uuid NOT NULL, "organization_id" uuid NOT NULL, CONSTRAINT "PK_user_to_oranization_map" PRIMARY KEY ("user_id", "organization_id"))`);
    await queryRunner.query(`ALTER TABLE "user_to_oranization_map" ADD CONSTRAINT "FK_user_to_oranization_map_user_id_users" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "user_to_oranization_map" ADD CONSTRAINT "FK_user_to_oranization_map_organization_id_organization" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "user_to_oranization_map" ADD CONSTRAINT "FK_user_to_oranization_map_created_by_id_users" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "user_to_oranization_map" ADD CONSTRAINT "FK_user_to_oranization_map_updated_by_id_users" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "user_to_oranization_map" ADD CONSTRAINT "FK_user_to_oranization_map_deleted_by_id_users" FOREIGN KEY ("deleted_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user_to_oranization_map" DROP CONSTRAINT "FK_user_to_oranization_map_deleted_by_id_users"`);
    await queryRunner.query(`ALTER TABLE "user_to_oranization_map" DROP CONSTRAINT "FK_user_to_oranization_map_updated_by_id_users"`);
    await queryRunner.query(`ALTER TABLE "user_to_oranization_map" DROP CONSTRAINT "FK_user_to_oranization_map_created_by_id_users"`);
    await queryRunner.query(`ALTER TABLE "user_to_oranization_map" DROP CONSTRAINT "FK_user_to_oranization_map_organization_id_organization"`);
    await queryRunner.query(`ALTER TABLE "user_to_oranization_map" DROP CONSTRAINT "FK_user_to_oranization_map_user_id_users"`);
    await queryRunner.query(`DROP TABLE "user_to_oranization_map"`);
  }
}
