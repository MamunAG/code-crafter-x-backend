import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFabricCosting1780500000000 implements MigrationInterface {
  name = 'AddFabricCosting1780500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "fabric_costing" ("created_by_id" uuid, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_by_id" uuid, "updated_at" TIMESTAMP DEFAULT now(), "deleted_at" TIMESTAMP, "deleted_by_id" uuid, "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "style_id" uuid, "fabric_id" uuid, "qty" numeric(18,4) NOT NULL DEFAULT '1', "unit_id" integer, "currency_id" integer NOT NULL, "cost_name" character varying(255), "organization_id" uuid, CONSTRAINT "PK_fabric_costing" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "fabric_costing_yarn" ("created_by_id" uuid, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_by_id" uuid, "updated_at" TIMESTAMP DEFAULT now(), "deleted_at" TIMESTAMP, "deleted_by_id" uuid, "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "fabric_costing_id" uuid NOT NULL, "yarn_id" uuid, "percentage_unit_fabric" numeric(18,4) NOT NULL DEFAULT '0', "yarn_price_unit" numeric(18,4) NOT NULL DEFAULT '0', "total_yarn_consumption" numeric(18,4) NOT NULL DEFAULT '0', "total_yarn_price" numeric(18,4) NOT NULL DEFAULT '0', CONSTRAINT "PK_fabric_costing_yarn" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "fabric_costing_yarn_process" ("created_by_id" uuid, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_by_id" uuid, "updated_at" TIMESTAMP DEFAULT now(), "deleted_at" TIMESTAMP, "deleted_by_id" uuid, "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "fabric_costing_yarn_id" uuid NOT NULL, "process_id" integer, "rate_unit_fabric" numeric(18,4) NOT NULL DEFAULT '0', "wastage_percentage" numeric(18,4) NOT NULL DEFAULT '0', CONSTRAINT "PK_fabric_costing_yarn_process" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "fabric_costing_common_process" ("created_by_id" uuid, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_by_id" uuid, "updated_at" TIMESTAMP DEFAULT now(), "deleted_at" TIMESTAMP, "deleted_by_id" uuid, "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "fabric_costing_id" uuid NOT NULL, "process_id" integer, "rate_unit_fabric" numeric(18,4) NOT NULL DEFAULT '0', "wastage_percentage" numeric(18,4) NOT NULL DEFAULT '0', CONSTRAINT "PK_fabric_costing_common_process" PRIMARY KEY ("id"))`,
    );

    await queryRunner.query(`ALTER TABLE "fabric_costing" ADD CONSTRAINT "FK_fabric_costing_created_by" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "fabric_costing" ADD CONSTRAINT "FK_fabric_costing_updated_by" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "fabric_costing" ADD CONSTRAINT "FK_fabric_costing_deleted_by" FOREIGN KEY ("deleted_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "fabric_costing" ADD CONSTRAINT "FK_fabric_costing_style" FOREIGN KEY ("style_id") REFERENCES "styles"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "fabric_costing" ADD CONSTRAINT "FK_fabric_costing_fabric" FOREIGN KEY ("fabric_id") REFERENCES "material"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "fabric_costing" ADD CONSTRAINT "FK_fabric_costing_unit" FOREIGN KEY ("unit_id") REFERENCES "uom"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "fabric_costing" ADD CONSTRAINT "FK_fabric_costing_currency" FOREIGN KEY ("currency_id") REFERENCES "currency"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "fabric_costing" ADD CONSTRAINT "FK_fabric_costing_organization" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);

    await queryRunner.query(`ALTER TABLE "fabric_costing_yarn" ADD CONSTRAINT "FK_fabric_costing_yarn_created_by" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "fabric_costing_yarn" ADD CONSTRAINT "FK_fabric_costing_yarn_updated_by" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "fabric_costing_yarn" ADD CONSTRAINT "FK_fabric_costing_yarn_deleted_by" FOREIGN KEY ("deleted_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "fabric_costing_yarn" ADD CONSTRAINT "FK_fabric_costing_yarn_parent" FOREIGN KEY ("fabric_costing_id") REFERENCES "fabric_costing"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "fabric_costing_yarn" ADD CONSTRAINT "FK_fabric_costing_yarn_material" FOREIGN KEY ("yarn_id") REFERENCES "material"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);

    await queryRunner.query(`ALTER TABLE "fabric_costing_yarn_process" ADD CONSTRAINT "FK_fabric_costing_yarn_process_created_by" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "fabric_costing_yarn_process" ADD CONSTRAINT "FK_fabric_costing_yarn_process_updated_by" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "fabric_costing_yarn_process" ADD CONSTRAINT "FK_fabric_costing_yarn_process_deleted_by" FOREIGN KEY ("deleted_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "fabric_costing_yarn_process" ADD CONSTRAINT "FK_fabric_costing_yarn_process_parent" FOREIGN KEY ("fabric_costing_yarn_id") REFERENCES "fabric_costing_yarn"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "fabric_costing_yarn_process" ADD CONSTRAINT "FK_fabric_costing_yarn_process_process" FOREIGN KEY ("process_id") REFERENCES "fabric_process"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);

    await queryRunner.query(`ALTER TABLE "fabric_costing_common_process" ADD CONSTRAINT "FK_fabric_costing_common_process_created_by" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "fabric_costing_common_process" ADD CONSTRAINT "FK_fabric_costing_common_process_updated_by" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "fabric_costing_common_process" ADD CONSTRAINT "FK_fabric_costing_common_process_deleted_by" FOREIGN KEY ("deleted_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "fabric_costing_common_process" ADD CONSTRAINT "FK_fabric_costing_common_process_parent" FOREIGN KEY ("fabric_costing_id") REFERENCES "fabric_costing"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "fabric_costing_common_process" ADD CONSTRAINT "FK_fabric_costing_common_process_process" FOREIGN KEY ("process_id") REFERENCES "fabric_process"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);

    await queryRunner.query(
      `INSERT INTO "menu" ("menu_name", "menu_path", "module_id", "description", "display_order", "is_active")
       SELECT 'Fabric Costing', '/merchandising/production/costing-budget/fabric-costing', "module_entry"."id", 'Create and manage fabric costing records.', 60, true
       FROM "module_entry"
       WHERE LOWER(TRIM("module_entry"."module_key")) = 'merchandising'
          OR LOWER(TRIM("module_entry"."module_name")) = 'merchandising'
       ORDER BY "module_entry"."display_order" ASC
       LIMIT 1
       ON CONFLICT DO NOTHING`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM "menu_permission" WHERE "menu_id" IN (SELECT "id" FROM "menu" WHERE "menu_name" = 'Fabric Costing' OR "menu_path" = '/merchandising/production/costing-budget/fabric-costing')`);
    await queryRunner.query(`DELETE FROM "menu_to_organization_map" WHERE "menu_id" IN (SELECT "id" FROM "menu" WHERE "menu_name" = 'Fabric Costing' OR "menu_path" = '/merchandising/production/costing-budget/fabric-costing')`);
    await queryRunner.query(`DELETE FROM "menu" WHERE "menu_name" = 'Fabric Costing' OR "menu_path" = '/merchandising/production/costing-budget/fabric-costing'`);
    await queryRunner.query(`DROP TABLE IF EXISTS "fabric_costing_common_process"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "fabric_costing_yarn_process"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "fabric_costing_yarn"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "fabric_costing"`);
  }
}
