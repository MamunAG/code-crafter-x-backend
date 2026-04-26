import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDefaultOrganizationToUserMap1777149999999 implements MigrationInterface {
  name = 'AddDefaultOrganizationToUserMap1777149999999';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user_to_oranization_map" ADD "is_default" boolean NOT NULL DEFAULT false`);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_user_to_oranization_map_default_per_user" ON "user_to_oranization_map" ("user_id") WHERE "is_default" = true`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_user_to_oranization_map_default_per_user"`);
    await queryRunner.query(`ALTER TABLE "user_to_oranization_map" DROP COLUMN "is_default"`);
  }
}
