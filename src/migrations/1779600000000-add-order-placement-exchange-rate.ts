import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOrderPlacementExchangeRate1779600000000
  implements MigrationInterface
{
  name = 'AddOrderPlacementExchangeRate1779600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "order_placement" ADD "exchange_rate" numeric(18,4) NOT NULL DEFAULT '1'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "order_placement" DROP COLUMN "exchange_rate"`,
    );
  }
}
