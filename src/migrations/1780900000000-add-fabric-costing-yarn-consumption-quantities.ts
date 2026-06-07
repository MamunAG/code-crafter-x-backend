import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFabricCostingYarnConsumptionQuantities1780900000000 implements MigrationInterface {
  name = 'AddFabricCostingYarnConsumptionQuantities1780900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "fabric_costing_yarn" ADD "grey_fabric_consumption_qty" numeric(18,4) NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "fabric_costing_yarn" ADD "yarn_dyeing_consumption_qty" numeric(18,4) NOT NULL DEFAULT '0'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "fabric_costing_yarn" DROP COLUMN "yarn_dyeing_consumption_qty"`);
    await queryRunner.query(`ALTER TABLE "fabric_costing_yarn" DROP COLUMN "grey_fabric_consumption_qty"`);
  }
}
