import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCurrencyExchangeRateTable1779300000000 implements MigrationInterface {
  name = 'AddCurrencyExchangeRateTable1779300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "currency_exchange_rate" (
        "id" SERIAL NOT NULL,
        "currency_date" TIMESTAMP NOT NULL,
        "currency_code" character varying NOT NULL,
        "rate_in_bdt" numeric(10,4) NOT NULL,
        CONSTRAINT "PK_currency_exchange_rate" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_name = 'currency_exchange_rate'
            AND column_name = 'bdt'
        ) AND NOT EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_name = 'currency_exchange_rate'
            AND column_name = 'rate_in_bdt'
        ) THEN
          ALTER TABLE "currency_exchange_rate" RENAME COLUMN "bdt" TO "rate_in_bdt";
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      ALTER TABLE "currency_exchange_rate"
      ADD COLUMN IF NOT EXISTS "rate_in_bdt" numeric(10,4)
    `);

    await queryRunner.query(`
      DELETE FROM "currency_exchange_rate" first_rate
      USING "currency_exchange_rate" duplicate_rate
      WHERE first_rate."currency_code" = duplicate_rate."currency_code"
        AND first_rate."currency_date" = duplicate_rate."currency_date"
        AND first_rate."id" < duplicate_rate."id"
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_currency_exchange_rate_code_date"
      ON "currency_exchange_rate" ("currency_code", "currency_date")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_currency_exchange_rate_code_date"');
    await queryRunner.query('DROP TABLE IF EXISTS "currency_exchange_rate"');
  }
}
