import { MigrationInterface, QueryRunner } from 'typeorm';

export class RenameJobDetailsCmToCmPerDzn1778091081162 implements MigrationInterface {
    name = 'RenameJobDetailsCmToCmPerDzn1778091081162';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DO $$
            BEGIN
                IF EXISTS (
                    SELECT 1
                    FROM information_schema.columns
                    WHERE table_schema = 'public'
                      AND table_name = 'job_details'
                      AND column_name = 'cm'
                ) AND NOT EXISTS (
                    SELECT 1
                    FROM information_schema.columns
                    WHERE table_schema = 'public'
                      AND table_name = 'job_details'
                      AND column_name = 'cm_per_dzn'
                ) THEN
                    ALTER TABLE "job_details" RENAME COLUMN "cm" TO "cm_per_dzn";
                END IF;
            END $$;
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DO $$
            BEGIN
                IF EXISTS (
                    SELECT 1
                    FROM information_schema.columns
                    WHERE table_schema = 'public'
                      AND table_name = 'job_details'
                      AND column_name = 'cm_per_dzn'
                ) AND NOT EXISTS (
                    SELECT 1
                    FROM information_schema.columns
                    WHERE table_schema = 'public'
                      AND table_name = 'job_details'
                      AND column_name = 'cm'
                ) THEN
                    ALTER TABLE "job_details" RENAME COLUMN "cm_per_dzn" TO "cm";
                END IF;
            END $$;
        `);
    }
}
