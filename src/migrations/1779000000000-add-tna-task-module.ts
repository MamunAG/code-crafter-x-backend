import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTnaTaskModule1779000000000 implements MigrationInterface {
  name = 'AddTnaTaskModule1779000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "tna_task" ("created_by_id" uuid, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_by_id" uuid, "updated_at" TIMESTAMP DEFAULT now(), "deleted_at" TIMESTAMP, "deleted_by_id" uuid, "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "is_active" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_tna_task" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "tna_task" ADD CONSTRAINT "FK_tna_task_created_by" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tna_task" ADD CONSTRAINT "FK_tna_task_updated_by" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tna_task" ADD CONSTRAINT "FK_tna_task_deleted_by" FOREIGN KEY ("deleted_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "tna_task" DROP CONSTRAINT "FK_tna_task_deleted_by"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tna_task" DROP CONSTRAINT "FK_tna_task_updated_by"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tna_task" DROP CONSTRAINT "FK_tna_task_created_by"`,
    );
    await queryRunner.query(`DROP TABLE "tna_task"`);
  }
}
