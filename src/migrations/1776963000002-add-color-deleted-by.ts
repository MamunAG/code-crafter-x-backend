import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddColorDeletedBy1776963000002 implements MigrationInterface {
  name = 'AddColorDeletedBy1776963000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const tables = [
      'users',
      'contact',
      'color',
      'country',
      'currency',
      'uom',
      'embellishment',
      'buyer',
      'size',
      'styles',
      'style_to_color_map',
      'style_to_embellishment_map',
      'style_to_size_map',
    ];

    for (const table of tables) {
      await queryRunner.query(`ALTER TABLE "${table}" ADD "deleted_by_id" uuid`);
      await queryRunner.query(
        `ALTER TABLE "${table}" ADD CONSTRAINT "FK_${table}_deleted_by_id_users" FOREIGN KEY ("deleted_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const tables = [
      'style_to_size_map',
      'style_to_embellishment_map',
      'style_to_color_map',
      'styles',
      'size',
      'buyer',
      'embellishment',
      'uom',
      'currency',
      'country',
      'color',
      'contact',
      'users',
    ];

    for (const table of tables) {
      await queryRunner.query(`ALTER TABLE "${table}" DROP CONSTRAINT "FK_${table}_deleted_by_id_users"`);
      await queryRunner.query(`ALTER TABLE "${table}" DROP COLUMN "deleted_by_id"`);
    }
  }
}
