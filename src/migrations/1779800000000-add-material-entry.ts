import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMaterialEntry1779800000000 implements MigrationInterface {
  name = 'AddMaterialEntry1779800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "material" ("created_by_id" uuid, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_by_id" uuid, "updated_at" TIMESTAMP DEFAULT now(), "deleted_at" TIMESTAMP, "deleted_by_id" uuid, "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "code" character varying, "description" text, "remarks" text, "organization_id" uuid, "is_active" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_material_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "material" ADD CONSTRAINT "FK_material_created_by" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "material" ADD CONSTRAINT "FK_material_updated_by" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "material" ADD CONSTRAINT "FK_material_deleted_by" FOREIGN KEY ("deleted_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "material" ADD CONSTRAINT "FK_material_organization" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `INSERT INTO "menu" ("menu_name", "menu_path", "module_id", "description", "display_order", "is_active")
       SELECT 'Material Entry', '/app-config/data/materials', "module_entry"."id", 'Create and manage material master data.', 45, true
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
      `DELETE FROM "menu_permission" WHERE "menu_id" IN (SELECT "id" FROM "menu" WHERE "menu_name" = 'Material Entry' OR "menu_path" = '/app-config/data/materials')`,
    );
    await queryRunner.query(
      `DELETE FROM "menu_to_organization_map" WHERE "menu_id" IN (SELECT "id" FROM "menu" WHERE "menu_name" = 'Material Entry' OR "menu_path" = '/app-config/data/materials')`,
    );
    await queryRunner.query(
      `DELETE FROM "menu" WHERE "menu_name" = 'Material Entry' OR "menu_path" = '/app-config/data/materials'`,
    );
    await queryRunner.query(
      `ALTER TABLE "material" DROP CONSTRAINT "FK_material_organization"`,
    );
    await queryRunner.query(
      `ALTER TABLE "material" DROP CONSTRAINT "FK_material_deleted_by"`,
    );
    await queryRunner.query(
      `ALTER TABLE "material" DROP CONSTRAINT "FK_material_updated_by"`,
    );
    await queryRunner.query(
      `ALTER TABLE "material" DROP CONSTRAINT "FK_material_created_by"`,
    );
    await queryRunner.query(`DROP TABLE "material"`);
  }
}
