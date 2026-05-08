import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddJobNumberColumns1778091081163 implements MigrationInterface {
    name = 'AddJobNumberColumns1778091081163';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "job" ADD COLUMN IF NOT EXISTS "job_no" character varying(50)`);
        await queryRunner.query(`ALTER TABLE "job" ADD COLUMN IF NOT EXISTS "job_serial" integer`);
        await queryRunner.query(`
            WITH numbered_jobs AS (
                SELECT
                    job.id,
                    ROW_NUMBER() OVER (
                        PARTITION BY factory.organization_id
                        ORDER BY job.created_at ASC, job.id ASC
                    ) AS serial
                FROM "job" job
                INNER JOIN "factory" factory ON factory.id = job.factory_id
            )
            UPDATE "job" job
            SET
                "job_serial" = numbered_jobs.serial,
                "job_no" = 'JOB-' || numbered_jobs.serial
            FROM numbered_jobs
            WHERE numbered_jobs.id = job.id
        `);
        await queryRunner.query(`ALTER TABLE "job" ALTER COLUMN "job_no" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "job" ALTER COLUMN "job_serial" SET NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "job" DROP COLUMN "job_serial"`);
        await queryRunner.query(`ALTER TABLE "job" DROP COLUMN "job_no"`);
    }
}
