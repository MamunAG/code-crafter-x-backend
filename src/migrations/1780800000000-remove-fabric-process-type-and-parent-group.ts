import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveFabricProcessTypeAndParentGroup1780800000000 implements MigrationInterface {
  name = 'RemoveFabricProcessTypeAndParentGroup1780800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "fabric_process" DROP CONSTRAINT "FK_fabric_process_parent"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_fabric_process_parent"`);
    await queryRunner.query(`ALTER TABLE "fabric_process" DROP CONSTRAINT "CHK_fabric_process_type"`);
    await queryRunner.query(`ALTER TABLE "fabric_process" DROP COLUMN "parent_process_id"`);
    await queryRunner.query(`ALTER TABLE "fabric_process" DROP COLUMN "process_type"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "fabric_process" ADD "process_type" character varying NOT NULL DEFAULT 'STEP'`);
    await queryRunner.query(`ALTER TABLE "fabric_process" ADD "parent_process_id" integer`);
    await queryRunner.query(`ALTER TABLE "fabric_process" ADD CONSTRAINT "CHK_fabric_process_type" CHECK ("process_type" IN ('GROUP', 'STEP'))`);
    await queryRunner.query(`CREATE INDEX "IDX_fabric_process_parent" ON "fabric_process" ("parent_process_id")`);
    await queryRunner.query(`ALTER TABLE "fabric_process" ADD CONSTRAINT "FK_fabric_process_parent" FOREIGN KEY ("parent_process_id") REFERENCES "fabric_process"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
  }
}
