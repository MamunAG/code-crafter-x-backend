import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOrganizationIdToMasterDataAndMerchandising1777254100000 implements MigrationInterface {
  name = 'AddOrganizationIdToMasterDataAndMerchandising1777254100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "currency" ADD "organization_id" uuid`);
    await queryRunner.query(`CREATE INDEX "IDX_currency_organization" ON "currency" ("organization_id")`);
    await queryRunner.query(`
      ALTER TABLE "currency"
      ADD CONSTRAINT "FK_currency_organization"
      FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`ALTER TABLE "uom" ADD "organization_id" uuid`);
    await queryRunner.query(`CREATE INDEX "IDX_uom_organization" ON "uom" ("organization_id")`);
    await queryRunner.query(`
      ALTER TABLE "uom"
      ADD CONSTRAINT "FK_uom_organization"
      FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`ALTER TABLE "color" ADD "organization_id" uuid`);
    await queryRunner.query(`CREATE INDEX "IDX_color_organization" ON "color" ("organization_id")`);
    await queryRunner.query(`
      ALTER TABLE "color"
      ADD CONSTRAINT "FK_color_organization"
      FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`ALTER TABLE "size" ADD "organization_id" uuid`);
    await queryRunner.query(`CREATE INDEX "IDX_size_organization" ON "size" ("organization_id")`);
    await queryRunner.query(`
      ALTER TABLE "size"
      ADD CONSTRAINT "FK_size_organization"
      FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`ALTER TABLE "embellishment" ADD "organization_id" uuid`);
    await queryRunner.query(`CREATE INDEX "IDX_embellishment_organization" ON "embellishment" ("organization_id")`);
    await queryRunner.query(`
      ALTER TABLE "embellishment"
      ADD CONSTRAINT "FK_embellishment_organization"
      FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`ALTER TABLE "buyer" ADD "organization_id" uuid`);
    await queryRunner.query(`CREATE INDEX "IDX_buyer_organization" ON "buyer" ("organization_id")`);
    await queryRunner.query(`ALTER TABLE "buyer" DROP CONSTRAINT "UQ_7911d7b9e729513dec55983fc50"`);
    await queryRunner.query(`
      ALTER TABLE "buyer"
      ADD CONSTRAINT "FK_buyer_organization"
      FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`ALTER TABLE "styles" ADD "organization_id" uuid`);
    await queryRunner.query(`CREATE INDEX "IDX_styles_organization" ON "styles" ("organization_id")`);
    await queryRunner.query(`
      ALTER TABLE "styles"
      ADD CONSTRAINT "FK_styles_organization"
      FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "styles" DROP CONSTRAINT "FK_styles_organization"`);
    await queryRunner.query(`DROP INDEX "IDX_styles_organization"`);
    await queryRunner.query(`ALTER TABLE "styles" DROP COLUMN "organization_id"`);

    await queryRunner.query(`ALTER TABLE "buyer" DROP CONSTRAINT "FK_buyer_organization"`);
    await queryRunner.query(`ALTER TABLE "buyer" ADD CONSTRAINT "UQ_7911d7b9e729513dec55983fc50" UNIQUE ("email")`);
    await queryRunner.query(`DROP INDEX "IDX_buyer_organization"`);
    await queryRunner.query(`ALTER TABLE "buyer" DROP COLUMN "organization_id"`);

    await queryRunner.query(`ALTER TABLE "embellishment" DROP CONSTRAINT "FK_embellishment_organization"`);
    await queryRunner.query(`DROP INDEX "IDX_embellishment_organization"`);
    await queryRunner.query(`ALTER TABLE "embellishment" DROP COLUMN "organization_id"`);

    await queryRunner.query(`ALTER TABLE "size" DROP CONSTRAINT "FK_size_organization"`);
    await queryRunner.query(`DROP INDEX "IDX_size_organization"`);
    await queryRunner.query(`ALTER TABLE "size" DROP COLUMN "organization_id"`);

    await queryRunner.query(`ALTER TABLE "color" DROP CONSTRAINT "FK_color_organization"`);
    await queryRunner.query(`DROP INDEX "IDX_color_organization"`);
    await queryRunner.query(`ALTER TABLE "color" DROP COLUMN "organization_id"`);

    await queryRunner.query(`ALTER TABLE "uom" DROP CONSTRAINT "FK_uom_organization"`);
    await queryRunner.query(`DROP INDEX "IDX_uom_organization"`);
    await queryRunner.query(`ALTER TABLE "uom" DROP COLUMN "organization_id"`);

    await queryRunner.query(`ALTER TABLE "currency" DROP CONSTRAINT "FK_currency_organization"`);
    await queryRunner.query(`DROP INDEX "IDX_currency_organization"`);
    await queryRunner.query(`ALTER TABLE "currency" DROP COLUMN "organization_id"`);
  }
}
