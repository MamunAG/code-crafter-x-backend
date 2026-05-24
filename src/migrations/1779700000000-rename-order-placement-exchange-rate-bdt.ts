import { MigrationInterface, QueryRunner } from 'typeorm';

export class RenameOrderPlacementExchangeRateBdt1779700000000
  implements MigrationInterface
{
  name = 'RenameOrderPlacementExchangeRateBdt1779700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "order_placement" RENAME COLUMN "exchange_rate" TO "exchange_rate_bdt"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "order_placement" RENAME COLUMN "exchange_rate_bdt" TO "exchange_rate"`,
    );
  }
}
