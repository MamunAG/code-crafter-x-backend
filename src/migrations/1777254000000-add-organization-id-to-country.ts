import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOrganizationIdToCountry1777254000000 implements MigrationInterface {
  name = 'AddOrganizationIdToCountry1777254000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "country" ADD "organization_id" uuid`);
    await queryRunner.query(`CREATE INDEX "IDX_country_organization" ON "country" ("organization_id")`);
    await queryRunner.query(`
      ALTER TABLE "country"
      ADD CONSTRAINT "FK_country_organization"
      FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "country" DROP CONSTRAINT "FK_country_organization"`);
    await queryRunner.query(`DROP INDEX "IDX_country_organization"`);
    await queryRunner.query(`ALTER TABLE "country" DROP COLUMN "organization_id"`);
  }
}
