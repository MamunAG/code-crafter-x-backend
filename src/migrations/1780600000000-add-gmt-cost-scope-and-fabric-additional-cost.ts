import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddGmtCostScopeAndFabricAdditionalCost1780600000000 implements MigrationInterface {
  name = 'AddGmtCostScopeAndFabricAdditionalCost1780600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "fabric_costing" ADD "finished_fabric_cost" numeric(18,4) NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(
      `CREATE TABLE "gmt_cost_scope" ("created_by_id" uuid, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_by_id" uuid, "updated_at" TIMESTAMP DEFAULT now(), "deleted_at" TIMESTAMP, "deleted_by_id" uuid, "id" SERIAL NOT NULL, "name" character varying NOT NULL, "organization_id" uuid NOT NULL, "is_active" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_gmt_cost_scope" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_gmt_cost_scope_org_name_active" ON "gmt_cost_scope" ("organization_id", LOWER(TRIM("name"))) WHERE "deleted_at" IS NULL`,
    );
    await queryRunner.query(
      `CREATE TABLE "fabric_costing_yarn_additional_cost" ("created_by_id" uuid, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_by_id" uuid, "updated_at" TIMESTAMP DEFAULT now(), "deleted_at" TIMESTAMP, "deleted_by_id" uuid, "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "fabric_costing_yarn_id" uuid NOT NULL, "gmt_cost_scope_id" integer, "percentage" numeric(18,4) NOT NULL DEFAULT '0', "direct_cost" numeric(18,4) NOT NULL DEFAULT '0', CONSTRAINT "CHK_fabric_yarn_additional_cost_percentage" CHECK ("percentage" >= 0 AND "percentage" <= 100), CONSTRAINT "CHK_fabric_yarn_additional_cost_direct" CHECK ("direct_cost" >= 0), CONSTRAINT "CHK_fabric_yarn_additional_cost_mode" CHECK (("percentage" > 0 AND "direct_cost" = 0) OR ("percentage" = 0 AND "direct_cost" > 0)), CONSTRAINT "UQ_fabric_yarn_additional_cost_scope" UNIQUE ("fabric_costing_yarn_id", "gmt_cost_scope_id"), CONSTRAINT "PK_fabric_yarn_additional_cost" PRIMARY KEY ("id"))`,
    );

    await queryRunner.query(`ALTER TABLE "gmt_cost_scope" ADD CONSTRAINT "FK_gmt_cost_scope_created_by" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "gmt_cost_scope" ADD CONSTRAINT "FK_gmt_cost_scope_updated_by" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "gmt_cost_scope" ADD CONSTRAINT "FK_gmt_cost_scope_deleted_by" FOREIGN KEY ("deleted_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "gmt_cost_scope" ADD CONSTRAINT "FK_gmt_cost_scope_organization" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);

    await queryRunner.query(`ALTER TABLE "fabric_costing_yarn_additional_cost" ADD CONSTRAINT "FK_fabric_yarn_additional_cost_created_by" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "fabric_costing_yarn_additional_cost" ADD CONSTRAINT "FK_fabric_yarn_additional_cost_updated_by" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "fabric_costing_yarn_additional_cost" ADD CONSTRAINT "FK_fabric_yarn_additional_cost_deleted_by" FOREIGN KEY ("deleted_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "fabric_costing_yarn_additional_cost" ADD CONSTRAINT "FK_fabric_yarn_additional_cost_parent" FOREIGN KEY ("fabric_costing_yarn_id") REFERENCES "fabric_costing_yarn"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "fabric_costing_yarn_additional_cost" ADD CONSTRAINT "FK_fabric_yarn_additional_cost_scope" FOREIGN KEY ("gmt_cost_scope_id") REFERENCES "gmt_cost_scope"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);

    await queryRunner.query(
      `INSERT INTO "gmt_cost_scope" ("organization_id", "name", "is_active")
       SELECT "organization"."id", "scope"."name", true
       FROM "organization"
       CROSS JOIN (VALUES ('Import Cost'), ('CM'), ('Print'), ('Embroidery')) AS "scope"("name")
       WHERE "organization"."deleted_at" IS NULL
       ON CONFLICT DO NOTHING`,
    );
    await queryRunner.query(
      `INSERT INTO "menu" ("menu_name", "menu_path", "module_id", "description", "display_order", "is_active")
       SELECT 'GMT Cost Scope Setup', '/merchandising/masters/gmt-cost-scopes', "module_entry"."id", 'Create and manage GMT cost scope master data.', 36, true
       FROM "module_entry"
       WHERE LOWER(TRIM("module_entry"."module_key")) = 'merchandising'
          OR LOWER(TRIM("module_entry"."module_name")) = 'merchandising'
       ORDER BY "module_entry"."display_order" ASC
       LIMIT 1
       ON CONFLICT DO NOTHING`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM "menu_permission" WHERE "menu_id" IN (SELECT "id" FROM "menu" WHERE "menu_name" = 'GMT Cost Scope Setup' OR "menu_path" = '/merchandising/masters/gmt-cost-scopes')`);
    await queryRunner.query(`DELETE FROM "menu_to_organization_map" WHERE "menu_id" IN (SELECT "id" FROM "menu" WHERE "menu_name" = 'GMT Cost Scope Setup' OR "menu_path" = '/merchandising/masters/gmt-cost-scopes')`);
    await queryRunner.query(`DELETE FROM "menu" WHERE "menu_name" = 'GMT Cost Scope Setup' OR "menu_path" = '/merchandising/masters/gmt-cost-scopes'`);
    await queryRunner.query(`DROP TABLE IF EXISTS "fabric_costing_yarn_additional_cost"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "gmt_cost_scope"`);
    await queryRunner.query(`ALTER TABLE "fabric_costing" DROP COLUMN IF EXISTS "finished_fabric_cost"`);
  }
}
