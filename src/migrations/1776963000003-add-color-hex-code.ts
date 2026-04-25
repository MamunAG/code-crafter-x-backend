import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddColorHexCode1776963000003 implements MigrationInterface {
  name = 'AddColorHexCode1776963000003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "color" ADD "color_hex_code" character varying`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "color" DROP COLUMN "color_hex_code"`);
  }
}
