import { MigrationInterface, QueryRunner } from "typeorm";

export class FirstMigration1780231275229 implements MigrationInterface {
    name = 'FirstMigration1780231275229'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "fabric_process" DROP CONSTRAINT "CHK_fabric_process_stage"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "fabric_process" ADD CONSTRAINT "CHK_fabric_process_stage" CHECK (((stage)::text = ANY ((ARRAY['YARN_PREPARATION'::character varying, 'YARN_TO_GREY'::character varying, 'GREY_TO_FINISHED'::character varying])::text[])))`);
    }

}
