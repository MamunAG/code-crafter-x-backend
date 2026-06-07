import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMaterialImage1780200000000 implements MigrationInterface {
  name = 'AddMaterialImage1780200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "material" ADD COLUMN IF NOT EXISTS "image_id" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "material" ADD CONSTRAINT "FK_material_image" FOREIGN KEY ("image_id") REFERENCES "files"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "material" DROP CONSTRAINT IF EXISTS "FK_material_image"`,
    );
    await queryRunner.query(
      `ALTER TABLE "material" DROP COLUMN IF EXISTS "image_id"`,
    );
  }
}
