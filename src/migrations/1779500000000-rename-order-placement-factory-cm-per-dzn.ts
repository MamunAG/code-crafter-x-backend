import { MigrationInterface, QueryRunner } from 'typeorm';

export class RenameOrderPlacementFactoryCmPerDzn1779500000000
  implements MigrationInterface
{
  name = 'RenameOrderPlacementFactoryCmPerDzn1779500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "order_placement_details" RENAME COLUMN "factory_cm" TO "factory_cm_per_dzn"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "order_placement_details" RENAME COLUMN "factory_cm_per_dzn" TO "factory_cm"`,
    );
  }
}
