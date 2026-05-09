import { MigrationInterface, QueryRunner } from "typeorm";

export class FirstMigration1778344060423 implements MigrationInterface {
    name = 'FirstMigration1778344060423'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "supplier" DROP CONSTRAINT "FK_1c6b4a6f3e9b4a3b8f4c7d1e2a3"`);
        await queryRunner.query(`ALTER TABLE "supplier" DROP CONSTRAINT "FK_2a4a5d4b6f8b8a3d3b2c2a8a6c1"`);
        await queryRunner.query(`ALTER TABLE "supplier" DROP CONSTRAINT "FK_6dd7b17f8af3f9a1e4d8bfae6d1"`);
        await queryRunner.query(`ALTER TABLE "supplier" DROP CONSTRAINT "FK_7b8f4b9f2c2b4d0b9d2a6d4e5f1"`);
        await queryRunner.query(`ALTER TABLE "supplier" DROP COLUMN "display_name"`);
        await queryRunner.query(`ALTER TABLE "supplier" ADD CONSTRAINT "FK_5d01ac8976e172ed55e65b05c3b" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "supplier" ADD CONSTRAINT "FK_23f21f4b44be054a9fc5eb2b932" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "supplier" ADD CONSTRAINT "FK_48d9566711f52c28cb1227591d7" FOREIGN KEY ("deleted_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "supplier" ADD CONSTRAINT "FK_34f860be6b7e9503d8a377d320f" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "supplier" DROP CONSTRAINT "FK_34f860be6b7e9503d8a377d320f"`);
        await queryRunner.query(`ALTER TABLE "supplier" DROP CONSTRAINT "FK_48d9566711f52c28cb1227591d7"`);
        await queryRunner.query(`ALTER TABLE "supplier" DROP CONSTRAINT "FK_23f21f4b44be054a9fc5eb2b932"`);
        await queryRunner.query(`ALTER TABLE "supplier" DROP CONSTRAINT "FK_5d01ac8976e172ed55e65b05c3b"`);
        await queryRunner.query(`ALTER TABLE "supplier" ADD "display_name" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "supplier" ADD CONSTRAINT "FK_7b8f4b9f2c2b4d0b9d2a6d4e5f1" FOREIGN KEY ("deleted_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "supplier" ADD CONSTRAINT "FK_6dd7b17f8af3f9a1e4d8bfae6d1" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "supplier" ADD CONSTRAINT "FK_2a4a5d4b6f8b8a3d3b2c2a8a6c1" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "supplier" ADD CONSTRAINT "FK_1c6b4a6f3e9b4a3b8f4c7d1e2a3" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
