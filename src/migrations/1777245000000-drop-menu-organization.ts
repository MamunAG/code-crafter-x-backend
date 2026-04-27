import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropMenuOrganization1777245000000 implements MigrationInterface {
  name = 'DropMenuOrganization1777245000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "menu" DROP CONSTRAINT "FK_menu_organization"`);
    await queryRunner.query(`DROP INDEX "IDX_menu_organization_active"`);
    await queryRunner.query(`DROP INDEX "IDX_menu_organization_id"`);
    await queryRunner.query(`DROP INDEX "UQ_menu_organization_path_active"`);
    await queryRunner.query(`ALTER TABLE "menu" DROP COLUMN "organization_id"`);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_menu_path_active"
      ON "menu" (lower(trim("menu_path")))
      WHERE "deleted_at" IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "UQ_menu_path_active"`);
    await queryRunner.query(`ALTER TABLE "menu" ADD "organization_id" uuid`);
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
}
