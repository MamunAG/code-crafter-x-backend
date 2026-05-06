import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1778083937296 implements MigrationInterface {
    name = 'Migration1778083937296'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "purchase_order" DROP CONSTRAINT "FK_purchase_order_created_by"`);
        await queryRunner.query(`ALTER TABLE "purchase_order" DROP CONSTRAINT "FK_purchase_order_deleted_by"`);
        await queryRunner.query(`ALTER TABLE "purchase_order" DROP CONSTRAINT "FK_purchase_order_updated_by"`);
        await queryRunner.query(`ALTER TABLE "employees" DROP CONSTRAINT "FK_employees_image"`);
        await queryRunner.query(`ALTER TABLE "job_details" DROP CONSTRAINT "FK_job_details_color"`);
        await queryRunner.query(`ALTER TABLE "job_details" DROP CONSTRAINT "FK_job_details_created_by"`);
        await queryRunner.query(`ALTER TABLE "job_details" DROP CONSTRAINT "FK_job_details_deleted_by"`);
        await queryRunner.query(`ALTER TABLE "job_details" DROP CONSTRAINT "FK_job_details_job"`);
        await queryRunner.query(`ALTER TABLE "job_details" DROP CONSTRAINT "FK_job_details_purchase_order"`);
        await queryRunner.query(`ALTER TABLE "job_details" DROP CONSTRAINT "FK_job_details_size"`);
        await queryRunner.query(`ALTER TABLE "job_details" DROP CONSTRAINT "FK_job_details_style"`);
        await queryRunner.query(`ALTER TABLE "job_details" DROP CONSTRAINT "FK_job_details_updated_by"`);
        await queryRunner.query(`ALTER TABLE "job" DROP CONSTRAINT "FK_job_buyer"`);
        await queryRunner.query(`ALTER TABLE "job" DROP CONSTRAINT "FK_job_created_by"`);
        await queryRunner.query(`ALTER TABLE "job" DROP CONSTRAINT "FK_job_deleted_by"`);
        await queryRunner.query(`ALTER TABLE "job" DROP CONSTRAINT "FK_job_factory"`);
        await queryRunner.query(`ALTER TABLE "job" DROP CONSTRAINT "FK_job_updated_by"`);
        await queryRunner.query(`DROP INDEX "code_crafter_x"."IDX_employees_image_id"`);
        await queryRunner.query(`ALTER TABLE "job" DROP COLUMN "merchandiser_id"`);
        await queryRunner.query(`ALTER TABLE "job" ADD "merchandiser_id" uuid`);
        await queryRunner.query(`ALTER TABLE "purchase_order" ADD CONSTRAINT "FK_3be9cd04f1379868b39b574c34c" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "purchase_order" ADD CONSTRAINT "FK_909c4f1cbbaa73a16c61d452479" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "purchase_order" ADD CONSTRAINT "FK_785ffd8c7f2d02c5abace24697e" FOREIGN KEY ("deleted_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "employees" ADD CONSTRAINT "FK_0d1c2a06c90311d8c53bfc653bf" FOREIGN KEY ("image_id") REFERENCES "files"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "job_details" ADD CONSTRAINT "FK_e479c92de22c32729d629740c3e" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "job_details" ADD CONSTRAINT "FK_1f83d40e93c3c9b89ede3333bc2" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "job_details" ADD CONSTRAINT "FK_0d7dc5bfa65b346d15c0e587add" FOREIGN KEY ("deleted_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "job_details" ADD CONSTRAINT "FK_d6dac7e08d2dd14a67e31a489bd" FOREIGN KEY ("job_id") REFERENCES "job"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "job_details" ADD CONSTRAINT "FK_cd84170eec7fc015f0950f64901" FOREIGN KEY ("po_id") REFERENCES "purchase_order"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "job_details" ADD CONSTRAINT "FK_5b46a56a5fbb033cd6b7ffc0915" FOREIGN KEY ("style_id") REFERENCES "styles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "job_details" ADD CONSTRAINT "FK_64824cc29df929ff0bd0628aa21" FOREIGN KEY ("size_id") REFERENCES "size"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "job_details" ADD CONSTRAINT "FK_27649715e2c8719a280b725977b" FOREIGN KEY ("color_id") REFERENCES "color"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "job" ADD CONSTRAINT "FK_70a700fa7e6133a31e1bbaecdb8" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "job" ADD CONSTRAINT "FK_73a9b4ec175f7f03208c33b511a" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "job" ADD CONSTRAINT "FK_9dbb73400639b68abd14dda83e4" FOREIGN KEY ("deleted_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "job" ADD CONSTRAINT "FK_ec6b4751839d214fd3802a2fa9d" FOREIGN KEY ("factory_id") REFERENCES "factory"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "job" ADD CONSTRAINT "FK_2756228a62988ab6c4875a94e84" FOREIGN KEY ("merchandiser_id") REFERENCES "employees"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "job" ADD CONSTRAINT "FK_483ddd4b5383c7959978afec1da" FOREIGN KEY ("buyer_id") REFERENCES "buyer"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "job" DROP CONSTRAINT "FK_483ddd4b5383c7959978afec1da"`);
        await queryRunner.query(`ALTER TABLE "job" DROP CONSTRAINT "FK_2756228a62988ab6c4875a94e84"`);
        await queryRunner.query(`ALTER TABLE "job" DROP CONSTRAINT "FK_ec6b4751839d214fd3802a2fa9d"`);
        await queryRunner.query(`ALTER TABLE "job" DROP CONSTRAINT "FK_9dbb73400639b68abd14dda83e4"`);
        await queryRunner.query(`ALTER TABLE "job" DROP CONSTRAINT "FK_73a9b4ec175f7f03208c33b511a"`);
        await queryRunner.query(`ALTER TABLE "job" DROP CONSTRAINT "FK_70a700fa7e6133a31e1bbaecdb8"`);
        await queryRunner.query(`ALTER TABLE "job_details" DROP CONSTRAINT "FK_27649715e2c8719a280b725977b"`);
        await queryRunner.query(`ALTER TABLE "job_details" DROP CONSTRAINT "FK_64824cc29df929ff0bd0628aa21"`);
        await queryRunner.query(`ALTER TABLE "job_details" DROP CONSTRAINT "FK_5b46a56a5fbb033cd6b7ffc0915"`);
        await queryRunner.query(`ALTER TABLE "job_details" DROP CONSTRAINT "FK_cd84170eec7fc015f0950f64901"`);
        await queryRunner.query(`ALTER TABLE "job_details" DROP CONSTRAINT "FK_d6dac7e08d2dd14a67e31a489bd"`);
        await queryRunner.query(`ALTER TABLE "job_details" DROP CONSTRAINT "FK_0d7dc5bfa65b346d15c0e587add"`);
        await queryRunner.query(`ALTER TABLE "job_details" DROP CONSTRAINT "FK_1f83d40e93c3c9b89ede3333bc2"`);
        await queryRunner.query(`ALTER TABLE "job_details" DROP CONSTRAINT "FK_e479c92de22c32729d629740c3e"`);
        await queryRunner.query(`ALTER TABLE "employees" DROP CONSTRAINT "FK_0d1c2a06c90311d8c53bfc653bf"`);
        await queryRunner.query(`ALTER TABLE "purchase_order" DROP CONSTRAINT "FK_785ffd8c7f2d02c5abace24697e"`);
        await queryRunner.query(`ALTER TABLE "purchase_order" DROP CONSTRAINT "FK_909c4f1cbbaa73a16c61d452479"`);
        await queryRunner.query(`ALTER TABLE "purchase_order" DROP CONSTRAINT "FK_3be9cd04f1379868b39b574c34c"`);
        await queryRunner.query(`ALTER TABLE "job" DROP COLUMN "merchandiser_id"`);
        await queryRunner.query(`ALTER TABLE "job" ADD "merchandiser_id" integer DEFAULT '0'`);
        await queryRunner.query(`CREATE INDEX "IDX_employees_image_id" ON "employees" ("image_id") `);
        await queryRunner.query(`ALTER TABLE "job" ADD CONSTRAINT "FK_job_updated_by" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "job" ADD CONSTRAINT "FK_job_factory" FOREIGN KEY ("factory_id") REFERENCES "factory"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "job" ADD CONSTRAINT "FK_job_deleted_by" FOREIGN KEY ("deleted_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "job" ADD CONSTRAINT "FK_job_created_by" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "job" ADD CONSTRAINT "FK_job_buyer" FOREIGN KEY ("buyer_id") REFERENCES "buyer"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "job_details" ADD CONSTRAINT "FK_job_details_updated_by" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "job_details" ADD CONSTRAINT "FK_job_details_style" FOREIGN KEY ("style_id") REFERENCES "styles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "job_details" ADD CONSTRAINT "FK_job_details_size" FOREIGN KEY ("size_id") REFERENCES "size"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "job_details" ADD CONSTRAINT "FK_job_details_purchase_order" FOREIGN KEY ("po_id") REFERENCES "purchase_order"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "job_details" ADD CONSTRAINT "FK_job_details_job" FOREIGN KEY ("job_id") REFERENCES "job"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "job_details" ADD CONSTRAINT "FK_job_details_deleted_by" FOREIGN KEY ("deleted_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "job_details" ADD CONSTRAINT "FK_job_details_created_by" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "job_details" ADD CONSTRAINT "FK_job_details_color" FOREIGN KEY ("color_id") REFERENCES "color"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "employees" ADD CONSTRAINT "FK_employees_image" FOREIGN KEY ("image_id") REFERENCES "files"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "purchase_order" ADD CONSTRAINT "FK_purchase_order_updated_by" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "purchase_order" ADD CONSTRAINT "FK_purchase_order_deleted_by" FOREIGN KEY ("deleted_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "purchase_order" ADD CONSTRAINT "FK_purchase_order_created_by" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
