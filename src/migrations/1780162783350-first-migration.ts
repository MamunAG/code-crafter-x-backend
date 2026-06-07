import { MigrationInterface, QueryRunner } from "typeorm";

export class FirstMigration1780162783350 implements MigrationInterface {
    name = 'FirstMigration1780162783350'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "gmt_cost_scope" DROP CONSTRAINT "FK_gmt_cost_scope_created_by"`);
        await queryRunner.query(`ALTER TABLE "gmt_cost_scope" DROP CONSTRAINT "FK_gmt_cost_scope_deleted_by"`);
        await queryRunner.query(`ALTER TABLE "gmt_cost_scope" DROP CONSTRAINT "FK_gmt_cost_scope_organization"`);
        await queryRunner.query(`ALTER TABLE "gmt_cost_scope" DROP CONSTRAINT "FK_gmt_cost_scope_updated_by"`);
        await queryRunner.query(`ALTER TABLE "fabric_costing_yarn_additional_cost" DROP CONSTRAINT "FK_fabric_yarn_additional_cost_created_by"`);
        await queryRunner.query(`ALTER TABLE "fabric_costing_yarn_additional_cost" DROP CONSTRAINT "FK_fabric_yarn_additional_cost_deleted_by"`);
        await queryRunner.query(`ALTER TABLE "fabric_costing_yarn_additional_cost" DROP CONSTRAINT "FK_fabric_yarn_additional_cost_parent"`);
        await queryRunner.query(`ALTER TABLE "fabric_costing_yarn_additional_cost" DROP CONSTRAINT "FK_fabric_yarn_additional_cost_scope"`);
        await queryRunner.query(`ALTER TABLE "fabric_costing_yarn_additional_cost" DROP CONSTRAINT "FK_fabric_yarn_additional_cost_updated_by"`);
        await queryRunner.query(`DROP INDEX "public"."UQ_gmt_cost_scope_org_name_active"`);
        await queryRunner.query(`ALTER TABLE "fabric_costing_yarn_additional_cost" DROP CONSTRAINT "CHK_fabric_yarn_additional_cost_percentage"`);
        await queryRunner.query(`ALTER TABLE "fabric_costing_yarn_additional_cost" DROP CONSTRAINT "CHK_fabric_yarn_additional_cost_direct"`);
        await queryRunner.query(`ALTER TABLE "fabric_costing_yarn_additional_cost" DROP CONSTRAINT "CHK_fabric_yarn_additional_cost_mode"`);
        await queryRunner.query(`ALTER TABLE "fabric_costing_yarn_additional_cost" DROP CONSTRAINT "UQ_fabric_yarn_additional_cost_scope"`);
        await queryRunner.query(`ALTER TABLE "fabric_costing_yarn" DROP COLUMN "total_yarn_consumption"`);
        await queryRunner.query(`ALTER TABLE "fabric_costing" ADD "finished_fabric_cost" numeric(18,4) NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "gmt_cost_scope" ADD CONSTRAINT "FK_235f2660202c38a502ef0913ca6" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "gmt_cost_scope" ADD CONSTRAINT "FK_7ab60fc1a32cd959d3cee012d11" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "gmt_cost_scope" ADD CONSTRAINT "FK_4c23e5323381b98f42a1b87de69" FOREIGN KEY ("deleted_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "gmt_cost_scope" ADD CONSTRAINT "FK_04319317f1059fc6a2571ce1436" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "fabric_costing_yarn_additional_cost" ADD CONSTRAINT "FK_5dfe3c7f5fa2f7de2f2e6f5fb88" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "fabric_costing_yarn_additional_cost" ADD CONSTRAINT "FK_2cde324180bd69ff85782ce56a4" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "fabric_costing_yarn_additional_cost" ADD CONSTRAINT "FK_84d50fcf2e07e619077930faf83" FOREIGN KEY ("deleted_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "fabric_costing_yarn_additional_cost" ADD CONSTRAINT "FK_c60f59b788286347931c5d3d4de" FOREIGN KEY ("fabric_costing_yarn_id") REFERENCES "fabric_costing_yarn"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "fabric_costing_yarn_additional_cost" ADD CONSTRAINT "FK_33b1104c72e8fd68bb4fa0584e7" FOREIGN KEY ("gmt_cost_scope_id") REFERENCES "gmt_cost_scope"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "fabric_costing_yarn_additional_cost" DROP CONSTRAINT "FK_33b1104c72e8fd68bb4fa0584e7"`);
        await queryRunner.query(`ALTER TABLE "fabric_costing_yarn_additional_cost" DROP CONSTRAINT "FK_c60f59b788286347931c5d3d4de"`);
        await queryRunner.query(`ALTER TABLE "fabric_costing_yarn_additional_cost" DROP CONSTRAINT "FK_84d50fcf2e07e619077930faf83"`);
        await queryRunner.query(`ALTER TABLE "fabric_costing_yarn_additional_cost" DROP CONSTRAINT "FK_2cde324180bd69ff85782ce56a4"`);
        await queryRunner.query(`ALTER TABLE "fabric_costing_yarn_additional_cost" DROP CONSTRAINT "FK_5dfe3c7f5fa2f7de2f2e6f5fb88"`);
        await queryRunner.query(`ALTER TABLE "gmt_cost_scope" DROP CONSTRAINT "FK_04319317f1059fc6a2571ce1436"`);
        await queryRunner.query(`ALTER TABLE "gmt_cost_scope" DROP CONSTRAINT "FK_4c23e5323381b98f42a1b87de69"`);
        await queryRunner.query(`ALTER TABLE "gmt_cost_scope" DROP CONSTRAINT "FK_7ab60fc1a32cd959d3cee012d11"`);
        await queryRunner.query(`ALTER TABLE "gmt_cost_scope" DROP CONSTRAINT "FK_235f2660202c38a502ef0913ca6"`);
        await queryRunner.query(`ALTER TABLE "fabric_costing" DROP COLUMN "finished_fabric_cost"`);
        await queryRunner.query(`ALTER TABLE "fabric_costing_yarn" ADD "total_yarn_consumption" numeric(18,4) NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "fabric_costing_yarn_additional_cost" ADD CONSTRAINT "UQ_fabric_yarn_additional_cost_scope" UNIQUE ("fabric_costing_yarn_id", "gmt_cost_scope_id")`);
        await queryRunner.query(`ALTER TABLE "fabric_costing_yarn_additional_cost" ADD CONSTRAINT "CHK_fabric_yarn_additional_cost_mode" CHECK ((((percentage > (0)::numeric) AND (direct_cost = (0)::numeric)) OR ((percentage = (0)::numeric) AND (direct_cost > (0)::numeric))))`);
        await queryRunner.query(`ALTER TABLE "fabric_costing_yarn_additional_cost" ADD CONSTRAINT "CHK_fabric_yarn_additional_cost_direct" CHECK ((direct_cost >= (0)::numeric))`);
        await queryRunner.query(`ALTER TABLE "fabric_costing_yarn_additional_cost" ADD CONSTRAINT "CHK_fabric_yarn_additional_cost_percentage" CHECK (((percentage >= (0)::numeric) AND (percentage <= (100)::numeric)))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "UQ_gmt_cost_scope_org_name_active" ON "gmt_cost_scope" ("organization_id") WHERE (deleted_at IS NULL)`);
        await queryRunner.query(`ALTER TABLE "fabric_costing_yarn_additional_cost" ADD CONSTRAINT "FK_fabric_yarn_additional_cost_updated_by" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "fabric_costing_yarn_additional_cost" ADD CONSTRAINT "FK_fabric_yarn_additional_cost_scope" FOREIGN KEY ("gmt_cost_scope_id") REFERENCES "gmt_cost_scope"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "fabric_costing_yarn_additional_cost" ADD CONSTRAINT "FK_fabric_yarn_additional_cost_parent" FOREIGN KEY ("fabric_costing_yarn_id") REFERENCES "fabric_costing_yarn"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "fabric_costing_yarn_additional_cost" ADD CONSTRAINT "FK_fabric_yarn_additional_cost_deleted_by" FOREIGN KEY ("deleted_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "fabric_costing_yarn_additional_cost" ADD CONSTRAINT "FK_fabric_yarn_additional_cost_created_by" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "gmt_cost_scope" ADD CONSTRAINT "FK_gmt_cost_scope_updated_by" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "gmt_cost_scope" ADD CONSTRAINT "FK_gmt_cost_scope_organization" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "gmt_cost_scope" ADD CONSTRAINT "FK_gmt_cost_scope_deleted_by" FOREIGN KEY ("deleted_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "gmt_cost_scope" ADD CONSTRAINT "FK_gmt_cost_scope_created_by" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
