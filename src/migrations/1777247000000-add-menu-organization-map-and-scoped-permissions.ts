import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMenuOrganizationMapAndScopedPermissions1777247000000 implements MigrationInterface {
  name = 'AddMenuOrganizationMapAndScopedPermissions1777247000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "menu_to_organization_map" (
        "created_by_id" character varying,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_by_id" character varying,
        "updated_at" TIMESTAMP DEFAULT now(),
        "deleted_at" TIMESTAMP,
        "deleted_by_id" character varying,
        "menu_id" uuid NOT NULL,
        "organization_id" uuid NOT NULL,
        CONSTRAINT "PK_menu_to_organization_map" PRIMARY KEY ("menu_id", "organization_id")
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_menu_to_org_map_menu" ON "menu_to_organization_map" ("menu_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_menu_to_org_map_organization" ON "menu_to_organization_map" ("organization_id")`);
    await queryRunner.query(`
      ALTER TABLE "menu_to_organization_map"
      ADD CONSTRAINT "FK_menu_to_org_map_menu"
      FOREIGN KEY ("menu_id") REFERENCES "menu"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "menu_to_organization_map"
      ADD CONSTRAINT "FK_menu_to_org_map_organization"
      FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`DROP INDEX IF EXISTS "UQ_menu_permission_user_menu_active"`);
    await queryRunner.query(`ALTER TABLE "menu_permission" ADD "organization_id" uuid`);
    await queryRunner.query(`
      UPDATE "menu_permission" "menu_permission"
      SET "organization_id" = "selected_organization"."organization_id"
      FROM (
        SELECT DISTINCT ON ("user_id") "user_id", "organization_id"
        FROM "user_to_oranization_map"
        WHERE "deleted_at" IS NULL
        ORDER BY "user_id", "is_default" DESC, "created_at" ASC
      ) "selected_organization"
      WHERE "selected_organization"."user_id" = "menu_permission"."user_id"
    `);
    await queryRunner.query(`
      INSERT INTO "menu_to_organization_map" ("menu_id", "organization_id")
      SELECT DISTINCT "menu_id", "organization_id"
      FROM "menu_permission"
      WHERE "organization_id" IS NOT NULL
      ON CONFLICT ("menu_id", "organization_id") DO NOTHING
    `);
    await queryRunner.query(`DELETE FROM "menu_permission" WHERE "organization_id" IS NULL`);
    await queryRunner.query(`ALTER TABLE "menu_permission" ALTER COLUMN "organization_id" SET NOT NULL`);
    await queryRunner.query(`CREATE INDEX "IDX_menu_permission_organization" ON "menu_permission" ("organization_id")`);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_menu_permission_org_user_menu_active"
      ON "menu_permission" ("organization_id", "user_id", "menu_id")
      WHERE "deleted_at" IS NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "menu_permission"
      ADD CONSTRAINT "FK_menu_permission_organization"
      FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "menu_permission" DROP CONSTRAINT "FK_menu_permission_organization"`);
    await queryRunner.query(`DROP INDEX "UQ_menu_permission_org_user_menu_active"`);
    await queryRunner.query(`DROP INDEX "IDX_menu_permission_organization"`);
    await queryRunner.query(`ALTER TABLE "menu_permission" DROP COLUMN "organization_id"`);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_menu_permission_user_menu_active"
      ON "menu_permission" ("user_id", "menu_id")
      WHERE "deleted_at" IS NULL
    `);

    await queryRunner.query(`ALTER TABLE "menu_to_organization_map" DROP CONSTRAINT "FK_menu_to_org_map_organization"`);
    await queryRunner.query(`ALTER TABLE "menu_to_organization_map" DROP CONSTRAINT "FK_menu_to_org_map_menu"`);
    await queryRunner.query(`DROP INDEX "IDX_menu_to_org_map_organization"`);
    await queryRunner.query(`DROP INDEX "IDX_menu_to_org_map_menu"`);
    await queryRunner.query(`DROP TABLE "menu_to_organization_map"`);
  }
}
