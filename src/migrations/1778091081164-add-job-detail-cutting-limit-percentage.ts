import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddJobDetailCuttingLimitPercentage1778091081164 implements MigrationInterface {
    name = 'AddJobDetailCuttingLimitPercentage1778091081164';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "job_details" ADD COLUMN IF NOT EXISTS "cutting_limit_percentage" numeric(18,4) NOT NULL DEFAULT '0'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "job_details" DROP COLUMN "cutting_limit_percentage"`);
    }
}
