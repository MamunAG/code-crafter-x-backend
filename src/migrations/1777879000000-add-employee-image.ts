import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEmployeeImage1777879000000 implements MigrationInterface {
    name = 'AddEmployeeImage1777879000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "employees" ADD "image_id" integer`);
        await queryRunner.query(`CREATE INDEX "IDX_employees_image_id" ON "employees" ("image_id")`);
        await queryRunner.query(`
            ALTER TABLE "employees"
            ADD CONSTRAINT "FK_employees_image"
            FOREIGN KEY ("image_id") REFERENCES "files"("id") ON DELETE SET NULL ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "employees" DROP CONSTRAINT "FK_employees_image"`);
        await queryRunner.query(`DROP INDEX "IDX_employees_image_id"`);
        await queryRunner.query(`ALTER TABLE "employees" DROP COLUMN "image_id"`);
    }
}
