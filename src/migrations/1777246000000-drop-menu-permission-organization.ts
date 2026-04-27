import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropMenuPermissionOrganization1777246000000 implements MigrationInterface {
  name = 'DropMenuPermissionOrganization1777246000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "menu_permission" DROP CONSTRAINT "FK_menu_permission_organization"`);
    await queryRunner.query(`DROP INDEX "UQ_menu_permission_org_user_menu_active"`);
    await queryRunner.query(`DROP INDEX "IDX_menu_permission_organization"`);
    await queryRunner.query(`ALTER TABLE "menu_permission" DROP COLUMN "organization_id"`);
    await queryRunner.query(`CREATE UNIQUE INDEX "UQ_menu_permission_user_menu_active" ON "menu_permission" ("user_id", "menu_id") WHERE "deleted_at" IS NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "UQ_menu_permission_user_menu_active"`);
    await queryRunner.query(`ALTER TABLE "menu_permission" ADD "organization_id" uuid`);
    await queryRunner.query(`CREATE INDEX "IDX_menu_permission_organization" ON "menu_permission" ("organization_id")`);
    await queryRunner.query(`CREATE UNIQUE INDEX "UQ_menu_permission_org_user_menu_active" ON "menu_permission" ("organization_id", "user_id", "menu_id") WHERE "deleted_at" IS NULL`);
    await queryRunner.query(`ALTER TABLE "menu_permission" ADD CONSTRAINT "FK_menu_permission_organization" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
  }
}
