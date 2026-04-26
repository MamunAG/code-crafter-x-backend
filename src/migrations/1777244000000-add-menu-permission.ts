import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMenuPermission1777244000000 implements MigrationInterface {
  name = 'AddMenuPermission1777244000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "menu_permission" (
        "created_by_id" character varying,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_by_id" character varying,
        "updated_at" TIMESTAMP DEFAULT now(),
        "deleted_at" TIMESTAMP,
        "deleted_by_id" character varying,
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "organization_id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "menu_id" uuid NOT NULL,
        "can_view" boolean NOT NULL DEFAULT false,
        "can_create" boolean NOT NULL DEFAULT false,
        "can_update" boolean NOT NULL DEFAULT false,
        "can_delete" boolean NOT NULL DEFAULT false,
        CONSTRAINT "PK_menu_permission_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_menu_permission_organization" ON "menu_permission" ("organization_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_menu_permission_user" ON "menu_permission" ("user_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_menu_permission_menu" ON "menu_permission" ("menu_id")`);
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
    await queryRunner.query(`
      ALTER TABLE "menu_permission"
      ADD CONSTRAINT "FK_menu_permission_user"
      FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "menu_permission"
      ADD CONSTRAINT "FK_menu_permission_menu"
      FOREIGN KEY ("menu_id") REFERENCES "menu"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "menu_permission" DROP CONSTRAINT "FK_menu_permission_menu"`);
    await queryRunner.query(`ALTER TABLE "menu_permission" DROP CONSTRAINT "FK_menu_permission_user"`);
    await queryRunner.query(`ALTER TABLE "menu_permission" DROP CONSTRAINT "FK_menu_permission_organization"`);
    await queryRunner.query(`DROP INDEX "UQ_menu_permission_org_user_menu_active"`);
    await queryRunner.query(`DROP INDEX "IDX_menu_permission_menu"`);
    await queryRunner.query(`DROP INDEX "IDX_menu_permission_user"`);
    await queryRunner.query(`DROP INDEX "IDX_menu_permission_organization"`);
    await queryRunner.query(`DROP TABLE "menu_permission"`);
  }
}
