import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveUomShortName1780300000000 implements MigrationInterface {
  name = 'RemoveUomShortName1780300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasShortNameColumn = await queryRunner.hasColumn('uom', 'short_name');

    if (hasShortNameColumn) {
      await queryRunner.query(`ALTER TABLE "uom" DROP COLUMN "short_name"`);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const hasShortNameColumn = await queryRunner.hasColumn('uom', 'short_name');

    if (!hasShortNameColumn) {
      await queryRunner.query(
        `ALTER TABLE "uom" ADD "short_name" character varying NOT NULL DEFAULT ''`,
      );
    }
  }
}
