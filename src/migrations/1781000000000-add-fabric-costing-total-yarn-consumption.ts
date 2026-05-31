import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFabricCostingTotalYarnConsumption1781000000000 implements MigrationInterface {
  name = 'AddFabricCostingTotalYarnConsumption1781000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "fabric_costing_yarn" ADD COLUMN IF NOT EXISTS "total_yarn_consumption" numeric(18,4) NOT NULL DEFAULT '0'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "fabric_costing_yarn" DROP COLUMN IF EXISTS "total_yarn_consumption"`,
    );
  }
}
