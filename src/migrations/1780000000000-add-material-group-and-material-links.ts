import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMaterialGroupAndMaterialLinks1780000000000
  implements MigrationInterface
{
  name = 'AddMaterialGroupAndMaterialLinks1780000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "material_group" ("created_by_id" uuid, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_by_id" uuid, "updated_at" TIMESTAMP DEFAULT now(), "deleted_at" TIMESTAMP, "deleted_by_id" uuid, "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "description" text, "organization_id" uuid, "is_active" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_material_group_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "material_group" ADD CONSTRAINT "FK_material_group_created_by" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "material_group" ADD CONSTRAINT "FK_material_group_updated_by" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "material_group" ADD CONSTRAINT "FK_material_group_deleted_by" FOREIGN KEY ("deleted_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "material_group" ADD CONSTRAINT "FK_material_group_organization" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `ALTER TABLE "material" ADD COLUMN IF NOT EXISTS "unit_id" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "material" ADD COLUMN IF NOT EXISTS "material_group_id" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "material" ADD CONSTRAINT "FK_material_unit" FOREIGN KEY ("unit_id") REFERENCES "uom"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "material" ADD CONSTRAINT "FK_material_material_group" FOREIGN KEY ("material_group_id") REFERENCES "material_group"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `INSERT INTO "menu" ("menu_name", "menu_path", "module_id", "description", "display_order", "is_active")
       SELECT 'Material Group Entry', '/app-config/data/material-groups', "module_entry"."id", 'Create and manage material group master data.', 44, true
       FROM "module_entry"
       WHERE LOWER(TRIM("module_entry"."module_key")) = 'app-config'
          OR LOWER(TRIM("module_entry"."module_name")) IN ('app config', 'app configuration')
       ORDER BY "module_entry"."display_order" ASC
       LIMIT 1
       ON CONFLICT DO NOTHING`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM "menu_permission" WHERE "menu_id" IN (SELECT "id" FROM "menu" WHERE "menu_name" = 'Material Group Entry' OR "menu_path" = '/app-config/data/material-groups')`,
    );
    await queryRunner.query(
      `DELETE FROM "menu_to_organization_map" WHERE "menu_id" IN (SELECT "id" FROM "menu" WHERE "menu_name" = 'Material Group Entry' OR "menu_path" = '/app-config/data/material-groups')`,
    );
    await queryRunner.query(
      `DELETE FROM "menu" WHERE "menu_name" = 'Material Group Entry' OR "menu_path" = '/app-config/data/material-groups'`,
    );

    await queryRunner.query(
      `ALTER TABLE "material" DROP CONSTRAINT IF EXISTS "FK_material_material_group"`,
    );
    await queryRunner.query(
      `ALTER TABLE "material" DROP CONSTRAINT IF EXISTS "FK_material_unit"`,
    );
    await queryRunner.query(
      `ALTER TABLE "material" DROP COLUMN IF EXISTS "material_group_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "material" DROP COLUMN IF EXISTS "unit_id"`,
    );

    await queryRunner.query(
      `ALTER TABLE "material_group" DROP CONSTRAINT IF EXISTS "FK_material_group_organization"`,
    );
    await queryRunner.query(
      `ALTER TABLE "material_group" DROP CONSTRAINT IF EXISTS "FK_material_group_deleted_by"`,
    );
    await queryRunner.query(
      `ALTER TABLE "material_group" DROP CONSTRAINT IF EXISTS "FK_material_group_updated_by"`,
    );
    await queryRunner.query(
      `ALTER TABLE "material_group" DROP CONSTRAINT IF EXISTS "FK_material_group_created_by"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "material_group"`);
  }
}
