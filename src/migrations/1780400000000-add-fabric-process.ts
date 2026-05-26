import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFabricProcess1780400000000 implements MigrationInterface {
  name = 'AddFabricProcess1780400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "fabric_process" ("created_by_id" uuid, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_by_id" uuid, "updated_at" TIMESTAMP DEFAULT now(), "deleted_at" TIMESTAMP, "deleted_by_id" uuid, "id" SERIAL NOT NULL, "name" character varying NOT NULL, "organization_id" uuid, "is_active" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_fabric_process" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "fabric_process" ADD CONSTRAINT "FK_fabric_process_created_by" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "fabric_process" ADD CONSTRAINT "FK_fabric_process_updated_by" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "fabric_process" ADD CONSTRAINT "FK_fabric_process_deleted_by" FOREIGN KEY ("deleted_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "fabric_process" ADD CONSTRAINT "FK_fabric_process_organization" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `INSERT INTO "menu" ("menu_name", "menu_path", "module_id", "description", "display_order", "is_active")
       SELECT 'Fabric Process Setup', '/merchandising/masters/fabric-processes', "module_entry"."id", 'Create and manage fabric process master data.', 35, true
       FROM "module_entry"
       WHERE LOWER(TRIM("module_entry"."module_key")) = 'merchandising'
          OR LOWER(TRIM("module_entry"."module_name")) = 'merchandising'
       ORDER BY "module_entry"."display_order" ASC
       LIMIT 1
       ON CONFLICT DO NOTHING`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM "menu_permission" WHERE "menu_id" IN (SELECT "id" FROM "menu" WHERE "menu_name" = 'Fabric Process Setup' OR "menu_path" = '/merchandising/masters/fabric-processes')`,
    );
    await queryRunner.query(
      `DELETE FROM "menu_to_organization_map" WHERE "menu_id" IN (SELECT "id" FROM "menu" WHERE "menu_name" = 'Fabric Process Setup' OR "menu_path" = '/merchandising/masters/fabric-processes')`,
    );
    await queryRunner.query(
      `DELETE FROM "menu" WHERE "menu_name" = 'Fabric Process Setup' OR "menu_path" = '/merchandising/masters/fabric-processes'`,
    );
    await queryRunner.query(
      `ALTER TABLE "fabric_process" DROP CONSTRAINT IF EXISTS "FK_fabric_process_organization"`,
    );
    await queryRunner.query(
      `ALTER TABLE "fabric_process" DROP CONSTRAINT IF EXISTS "FK_fabric_process_deleted_by"`,
    );
    await queryRunner.query(
      `ALTER TABLE "fabric_process" DROP CONSTRAINT IF EXISTS "FK_fabric_process_updated_by"`,
    );
    await queryRunner.query(
      `ALTER TABLE "fabric_process" DROP CONSTRAINT IF EXISTS "FK_fabric_process_created_by"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "fabric_process"`);
  }
}
