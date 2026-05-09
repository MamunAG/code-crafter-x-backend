import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTnaModule1779000001000 implements MigrationInterface {
  name = 'AddTnaModule1779000001000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "tna" ("created_by_id" uuid, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_by_id" uuid, "updated_at" TIMESTAMP DEFAULT now(), "deleted_at" TIMESTAMP, "deleted_by_id" uuid, "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "buyer_id" uuid NOT NULL, "job_id" uuid NOT NULL, "lead_time" integer NOT NULL, CONSTRAINT "PK_tna" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "tna_details" ("created_by_id" uuid, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_by_id" uuid, "updated_at" TIMESTAMP DEFAULT now(), "deleted_at" TIMESTAMP, "deleted_by_id" uuid, "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tna_id" uuid NOT NULL, "task_id" uuid NOT NULL, "execution_date" date NOT NULL, "days" integer NOT NULL, "relation_formula" text NOT NULL, CONSTRAINT "PK_tna_details" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "tna" ADD CONSTRAINT "FK_tna_created_by" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tna" ADD CONSTRAINT "FK_tna_updated_by" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tna" ADD CONSTRAINT "FK_tna_deleted_by" FOREIGN KEY ("deleted_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tna" ADD CONSTRAINT "FK_tna_buyer" FOREIGN KEY ("buyer_id") REFERENCES "buyer"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tna" ADD CONSTRAINT "FK_tna_job" FOREIGN KEY ("job_id") REFERENCES "job"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tna_details" ADD CONSTRAINT "FK_tna_details_created_by" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tna_details" ADD CONSTRAINT "FK_tna_details_updated_by" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tna_details" ADD CONSTRAINT "FK_tna_details_deleted_by" FOREIGN KEY ("deleted_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tna_details" ADD CONSTRAINT "FK_tna_details_tna" FOREIGN KEY ("tna_id") REFERENCES "tna"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tna_details" ADD CONSTRAINT "FK_tna_details_task" FOREIGN KEY ("task_id") REFERENCES "tna_task"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "tna_details" DROP CONSTRAINT "FK_tna_details_task"`);
    await queryRunner.query(`ALTER TABLE "tna_details" DROP CONSTRAINT "FK_tna_details_tna"`);
    await queryRunner.query(`ALTER TABLE "tna_details" DROP CONSTRAINT "FK_tna_details_deleted_by"`);
    await queryRunner.query(`ALTER TABLE "tna_details" DROP CONSTRAINT "FK_tna_details_updated_by"`);
    await queryRunner.query(`ALTER TABLE "tna_details" DROP CONSTRAINT "FK_tna_details_created_by"`);
    await queryRunner.query(`ALTER TABLE "tna" DROP CONSTRAINT "FK_tna_job"`);
    await queryRunner.query(`ALTER TABLE "tna" DROP CONSTRAINT "FK_tna_buyer"`);
    await queryRunner.query(`ALTER TABLE "tna" DROP CONSTRAINT "FK_tna_deleted_by"`);
    await queryRunner.query(`ALTER TABLE "tna" DROP CONSTRAINT "FK_tna_updated_by"`);
    await queryRunner.query(`ALTER TABLE "tna" DROP CONSTRAINT "FK_tna_created_by"`);
    await queryRunner.query(`DROP TABLE "tna_details"`);
    await queryRunner.query(`DROP TABLE "tna"`);
  }
}
