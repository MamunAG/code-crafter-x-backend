import { MigrationInterface, QueryRunner } from "typeorm";

export class FirstMigration1778413492871 implements MigrationInterface {
    name = 'FirstMigration1778413492871'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tna_task" DROP CONSTRAINT "FK_tna_task_created_by"`);
        await queryRunner.query(`ALTER TABLE "tna_task" DROP CONSTRAINT "FK_tna_task_deleted_by"`);
        await queryRunner.query(`ALTER TABLE "tna_task" DROP CONSTRAINT "FK_tna_task_updated_by"`);
        await queryRunner.query(`ALTER TABLE "tna_details" DROP CONSTRAINT "FK_tna_details_created_by"`);
        await queryRunner.query(`ALTER TABLE "tna_details" DROP CONSTRAINT "FK_tna_details_deleted_by"`);
        await queryRunner.query(`ALTER TABLE "tna_details" DROP CONSTRAINT "FK_tna_details_task"`);
        await queryRunner.query(`ALTER TABLE "tna_details" DROP CONSTRAINT "FK_tna_details_tna"`);
        await queryRunner.query(`ALTER TABLE "tna_details" DROP CONSTRAINT "FK_tna_details_updated_by"`);
        await queryRunner.query(`ALTER TABLE "tna" DROP CONSTRAINT "FK_tna_buyer"`);
        await queryRunner.query(`ALTER TABLE "tna" DROP CONSTRAINT "FK_tna_created_by"`);
        await queryRunner.query(`ALTER TABLE "tna" DROP CONSTRAINT "FK_tna_deleted_by"`);
        await queryRunner.query(`ALTER TABLE "tna" DROP CONSTRAINT "FK_tna_job"`);
        await queryRunner.query(`ALTER TABLE "tna" DROP CONSTRAINT "FK_tna_updated_by"`);
        await queryRunner.query(`ALTER TABLE "tna_details" ALTER COLUMN "relation_formula" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "tna_task" ADD CONSTRAINT "FK_fa8a32cecf563da5d006c7259b8" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tna_task" ADD CONSTRAINT "FK_6e038d763f88570f9dff804ec25" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tna_task" ADD CONSTRAINT "FK_75a5ce1375e2518833a044326c3" FOREIGN KEY ("deleted_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tna_details" ADD CONSTRAINT "FK_35d13a3559bd8cdfc3159f222b1" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tna_details" ADD CONSTRAINT "FK_a46906942a5e14140c9c13a4dd4" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tna_details" ADD CONSTRAINT "FK_77bac1c52af018680688074b4ed" FOREIGN KEY ("deleted_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tna_details" ADD CONSTRAINT "FK_310066ba1719d25164fc126e99f" FOREIGN KEY ("tna_id") REFERENCES "tna"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tna_details" ADD CONSTRAINT "FK_754ee8d2830b5e23efd34bf065f" FOREIGN KEY ("task_id") REFERENCES "tna_task"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tna" ADD CONSTRAINT "FK_3b0b933067917f68506e16ad1b3" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tna" ADD CONSTRAINT "FK_4f421d8e8cafea6c6ab88f89f2b" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tna" ADD CONSTRAINT "FK_742808c070eee33e879e4e64061" FOREIGN KEY ("deleted_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tna" ADD CONSTRAINT "FK_e3c8005676750e4bcf0baa89ddb" FOREIGN KEY ("buyer_id") REFERENCES "buyer"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tna" ADD CONSTRAINT "FK_71fa56011e8cc7b613f7a87e836" FOREIGN KEY ("job_id") REFERENCES "job"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tna" DROP CONSTRAINT "FK_71fa56011e8cc7b613f7a87e836"`);
        await queryRunner.query(`ALTER TABLE "tna" DROP CONSTRAINT "FK_e3c8005676750e4bcf0baa89ddb"`);
        await queryRunner.query(`ALTER TABLE "tna" DROP CONSTRAINT "FK_742808c070eee33e879e4e64061"`);
        await queryRunner.query(`ALTER TABLE "tna" DROP CONSTRAINT "FK_4f421d8e8cafea6c6ab88f89f2b"`);
        await queryRunner.query(`ALTER TABLE "tna" DROP CONSTRAINT "FK_3b0b933067917f68506e16ad1b3"`);
        await queryRunner.query(`ALTER TABLE "tna_details" DROP CONSTRAINT "FK_754ee8d2830b5e23efd34bf065f"`);
        await queryRunner.query(`ALTER TABLE "tna_details" DROP CONSTRAINT "FK_310066ba1719d25164fc126e99f"`);
        await queryRunner.query(`ALTER TABLE "tna_details" DROP CONSTRAINT "FK_77bac1c52af018680688074b4ed"`);
        await queryRunner.query(`ALTER TABLE "tna_details" DROP CONSTRAINT "FK_a46906942a5e14140c9c13a4dd4"`);
        await queryRunner.query(`ALTER TABLE "tna_details" DROP CONSTRAINT "FK_35d13a3559bd8cdfc3159f222b1"`);
        await queryRunner.query(`ALTER TABLE "tna_task" DROP CONSTRAINT "FK_75a5ce1375e2518833a044326c3"`);
        await queryRunner.query(`ALTER TABLE "tna_task" DROP CONSTRAINT "FK_6e038d763f88570f9dff804ec25"`);
        await queryRunner.query(`ALTER TABLE "tna_task" DROP CONSTRAINT "FK_fa8a32cecf563da5d006c7259b8"`);
        await queryRunner.query(`ALTER TABLE "tna_details" ALTER COLUMN "relation_formula" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "tna" ADD CONSTRAINT "FK_tna_updated_by" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tna" ADD CONSTRAINT "FK_tna_job" FOREIGN KEY ("job_id") REFERENCES "job"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tna" ADD CONSTRAINT "FK_tna_deleted_by" FOREIGN KEY ("deleted_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tna" ADD CONSTRAINT "FK_tna_created_by" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tna" ADD CONSTRAINT "FK_tna_buyer" FOREIGN KEY ("buyer_id") REFERENCES "buyer"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tna_details" ADD CONSTRAINT "FK_tna_details_updated_by" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tna_details" ADD CONSTRAINT "FK_tna_details_tna" FOREIGN KEY ("tna_id") REFERENCES "tna"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tna_details" ADD CONSTRAINT "FK_tna_details_task" FOREIGN KEY ("task_id") REFERENCES "tna_task"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tna_details" ADD CONSTRAINT "FK_tna_details_deleted_by" FOREIGN KEY ("deleted_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tna_details" ADD CONSTRAINT "FK_tna_details_created_by" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tna_task" ADD CONSTRAINT "FK_tna_task_updated_by" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tna_task" ADD CONSTRAINT "FK_tna_task_deleted_by" FOREIGN KEY ("deleted_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tna_task" ADD CONSTRAINT "FK_tna_task_created_by" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
