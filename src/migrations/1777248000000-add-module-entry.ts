import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddModuleEntry1777248000000 implements MigrationInterface {
  name = 'AddModuleEntry1777248000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "module_entry" (
        "created_by_id" character varying,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_by_id" character varying,
        "updated_at" TIMESTAMP DEFAULT now(),
        "deleted_at" TIMESTAMP,
        "deleted_by_id" character varying,
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "module_name" character varying NOT NULL,
        "module_key" character varying NOT NULL,
        "description" text,
        "display_order" integer NOT NULL DEFAULT 0,
        "is_active" boolean NOT NULL DEFAULT true,
        CONSTRAINT "PK_module_entry_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_module_entry_active" ON "module_entry" ("is_active")`);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_module_entry_key_active"
      ON "module_entry" (lower(trim("module_key")))
      WHERE "deleted_at" IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "UQ_module_entry_key_active"`);
    await queryRunner.query(`DROP INDEX "IDX_module_entry_active"`);
    await queryRunner.query(`DROP TABLE "module_entry"`);
  }
}
