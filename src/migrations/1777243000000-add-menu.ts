import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMenu1777243000000 implements MigrationInterface {
  name = 'AddMenu1777243000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "menu" (
        "created_by_id" character varying,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_by_id" character varying,
        "updated_at" TIMESTAMP DEFAULT now(),
        "deleted_at" TIMESTAMP,
        "deleted_by_id" character varying,
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "organization_id" uuid NOT NULL,
        "menu_name" character varying NOT NULL,
        "menu_path" character varying NOT NULL,
        "description" text,
        "display_order" integer NOT NULL DEFAULT 0,
        "is_active" boolean NOT NULL DEFAULT true,
        CONSTRAINT "PK_menu_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_menu_organization_id" ON "menu" ("organization_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_menu_organization_active" ON "menu" ("organization_id", "is_active")`);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_menu_organization_path_active"
      ON "menu" ("organization_id", lower(trim("menu_path")))
      WHERE "deleted_at" IS NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "menu"
      ADD CONSTRAINT "FK_menu_organization"
      FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "menu" DROP CONSTRAINT "FK_menu_organization"`);
    await queryRunner.query(`DROP INDEX "UQ_menu_organization_path_active"`);
    await queryRunner.query(`DROP INDEX "IDX_menu_organization_active"`);
    await queryRunner.query(`DROP INDEX "IDX_menu_organization_id"`);
    await queryRunner.query(`DROP TABLE "menu"`);
  }
}
