import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1777622581348 implements MigrationInterface {
    name = 'Migration1777622581348'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "buyer" DROP CONSTRAINT "FK_84ca5aa0a0a24dbca0a83648b28"`);
        await queryRunner.query(`ALTER TABLE "buyer" ALTER COLUMN "contact" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "buyer" ALTER COLUMN "email" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "buyer" ALTER COLUMN "country_id" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "buyer" ALTER COLUMN "address" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "buyer" ADD CONSTRAINT "FK_84ca5aa0a0a24dbca0a83648b28" FOREIGN KEY ("country_id") REFERENCES "country"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "buyer" DROP CONSTRAINT "FK_84ca5aa0a0a24dbca0a83648b28"`);
        await queryRunner.query(`ALTER TABLE "buyer" ALTER COLUMN "address" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "buyer" ALTER COLUMN "country_id" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "buyer" ALTER COLUMN "email" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "buyer" ALTER COLUMN "contact" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "buyer" ADD CONSTRAINT "FK_84ca5aa0a0a24dbca0a83648b28" FOREIGN KEY ("country_id") REFERENCES "country"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
