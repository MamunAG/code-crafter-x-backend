import { MigrationInterface, QueryRunner } from "typeorm";

export class FirstMigration1779722133167 implements MigrationInterface {
    name = 'FirstMigration1779722133167'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "material_group" DROP CONSTRAINT "FK_material_group_created_by"`);
        await queryRunner.query(`ALTER TABLE "material_group" DROP CONSTRAINT "FK_material_group_deleted_by"`);
        await queryRunner.query(`ALTER TABLE "material_group" DROP CONSTRAINT "FK_material_group_organization"`);
        await queryRunner.query(`ALTER TABLE "material_group" DROP CONSTRAINT "FK_material_group_updated_by"`);
        await queryRunner.query(`ALTER TABLE "material" DROP CONSTRAINT "FK_material_created_by"`);
        await queryRunner.query(`ALTER TABLE "material" DROP CONSTRAINT "FK_material_deleted_by"`);
        await queryRunner.query(`ALTER TABLE "material" DROP CONSTRAINT "FK_material_material_group"`);
        await queryRunner.query(`ALTER TABLE "material" DROP CONSTRAINT "FK_material_organization"`);
        await queryRunner.query(`ALTER TABLE "material" DROP CONSTRAINT "FK_material_unit"`);
        await queryRunner.query(`ALTER TABLE "material" DROP CONSTRAINT "FK_material_updated_by"`);
        await queryRunner.query(`ALTER TABLE "material_group" ADD CONSTRAINT "FK_e7d73e66386a8a338721a9a9cc2" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "material_group" ADD CONSTRAINT "FK_b438ec790d3ed541ad94db4cfa5" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "material_group" ADD CONSTRAINT "FK_4778d2e0f1298d7aa545abcd3cf" FOREIGN KEY ("deleted_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "material_group" ADD CONSTRAINT "FK_cdc407a9a7e62d7c0547471fa2e" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "material" ADD CONSTRAINT "FK_c5803adca0b7be4e8b0973ecbd5" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "material" ADD CONSTRAINT "FK_84481926d53c388fb036a79371f" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "material" ADD CONSTRAINT "FK_4c72e9773620a82b1f75c0d8ae4" FOREIGN KEY ("deleted_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "material" ADD CONSTRAINT "FK_340dd08a7e087035ed32a48f876" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "material" ADD CONSTRAINT "FK_91f05e25b0e0cb99f974ab38851" FOREIGN KEY ("unit_id") REFERENCES "uom"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "material" ADD CONSTRAINT "FK_80a846429db6c9d746bf35e85ec" FOREIGN KEY ("material_group_id") REFERENCES "material_group"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "material" DROP CONSTRAINT "FK_80a846429db6c9d746bf35e85ec"`);
        await queryRunner.query(`ALTER TABLE "material" DROP CONSTRAINT "FK_91f05e25b0e0cb99f974ab38851"`);
        await queryRunner.query(`ALTER TABLE "material" DROP CONSTRAINT "FK_340dd08a7e087035ed32a48f876"`);
        await queryRunner.query(`ALTER TABLE "material" DROP CONSTRAINT "FK_4c72e9773620a82b1f75c0d8ae4"`);
        await queryRunner.query(`ALTER TABLE "material" DROP CONSTRAINT "FK_84481926d53c388fb036a79371f"`);
        await queryRunner.query(`ALTER TABLE "material" DROP CONSTRAINT "FK_c5803adca0b7be4e8b0973ecbd5"`);
        await queryRunner.query(`ALTER TABLE "material_group" DROP CONSTRAINT "FK_cdc407a9a7e62d7c0547471fa2e"`);
        await queryRunner.query(`ALTER TABLE "material_group" DROP CONSTRAINT "FK_4778d2e0f1298d7aa545abcd3cf"`);
        await queryRunner.query(`ALTER TABLE "material_group" DROP CONSTRAINT "FK_b438ec790d3ed541ad94db4cfa5"`);
        await queryRunner.query(`ALTER TABLE "material_group" DROP CONSTRAINT "FK_e7d73e66386a8a338721a9a9cc2"`);
        await queryRunner.query(`ALTER TABLE "material" ADD CONSTRAINT "FK_material_updated_by" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "material" ADD CONSTRAINT "FK_material_unit" FOREIGN KEY ("unit_id") REFERENCES "uom"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "material" ADD CONSTRAINT "FK_material_organization" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "material" ADD CONSTRAINT "FK_material_material_group" FOREIGN KEY ("material_group_id") REFERENCES "material_group"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "material" ADD CONSTRAINT "FK_material_deleted_by" FOREIGN KEY ("deleted_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "material" ADD CONSTRAINT "FK_material_created_by" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "material_group" ADD CONSTRAINT "FK_material_group_updated_by" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "material_group" ADD CONSTRAINT "FK_material_group_organization" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "material_group" ADD CONSTRAINT "FK_material_group_deleted_by" FOREIGN KEY ("deleted_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "material_group" ADD CONSTRAINT "FK_material_group_created_by" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
