import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveMaterialGroupCode1780100000000
  implements MigrationInterface
{
  name = 'RemoveMaterialGroupCode1780100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasCodeColumn = await queryRunner.hasColumn('material_group', 'code');

    if (hasCodeColumn) {
      await queryRunner.query(`ALTER TABLE "material_group" DROP COLUMN "code"`);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const hasCodeColumn = await queryRunner.hasColumn('material_group', 'code');

    if (!hasCodeColumn) {
      await queryRunner.query(
        `ALTER TABLE "material_group" ADD "code" character varying`,
      );
    }
  }
}
