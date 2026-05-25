import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveMaterialRemarks1779900000000 implements MigrationInterface {
  name = 'RemoveMaterialRemarks1779900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasRemarksColumn = await queryRunner.hasColumn('material', 'remarks');

    if (hasRemarksColumn) {
      await queryRunner.query(`ALTER TABLE "material" DROP COLUMN "remarks"`);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const hasRemarksColumn = await queryRunner.hasColumn('material', 'remarks');

    if (!hasRemarksColumn) {
      await queryRunner.query(`ALTER TABLE "material" ADD "remarks" text`);
    }
  }
}
