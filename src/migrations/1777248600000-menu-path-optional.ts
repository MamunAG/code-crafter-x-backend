import { MigrationInterface, QueryRunner } from 'typeorm';

export class MenuPathOptional1777248600000 implements MigrationInterface {
  name = 'MenuPathOptional1777248600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "menu" ALTER COLUMN "menu_path" DROP NOT NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "menu" ALTER COLUMN "menu_path" SET NOT NULL`);
  }
}
