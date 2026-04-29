import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMenuModule1777248500000 implements MigrationInterface {
  name = 'AddMenuModule1777248500000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "menu" ADD "module_id" uuid`);
    await queryRunner.query(`CREATE INDEX "IDX_menu_module_id" ON "menu" ("module_id")`);
    await queryRunner.query(`
      ALTER TABLE "menu"
      ADD CONSTRAINT "FK_menu_module"
      FOREIGN KEY ("module_id") REFERENCES "module_entry"("id") ON DELETE RESTRICT ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "menu" DROP CONSTRAINT "FK_menu_module"`);
    await queryRunner.query(`DROP INDEX "IDX_menu_module_id"`);
    await queryRunner.query(`ALTER TABLE "menu" DROP COLUMN "module_id"`);
  }
}
