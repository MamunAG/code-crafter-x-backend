import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFactoryImage1777772158000 implements MigrationInterface {
    name = 'AddFactoryImage1777772158000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "factory" ADD "image_id" integer`);
        await queryRunner.query(`ALTER TABLE "factory" ADD CONSTRAINT "FK_factory_image_id_files_id" FOREIGN KEY ("image_id") REFERENCES "files"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "factory" DROP CONSTRAINT "FK_factory_image_id_files_id"`);
        await queryRunner.query(`ALTER TABLE "factory" DROP COLUMN "image_id"`);
    }
}
