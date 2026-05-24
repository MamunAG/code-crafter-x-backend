import { MigrationInterface, QueryRunner } from "typeorm";

export class FirstMigration1779645149632 implements MigrationInterface {
    name = 'FirstMigration1779645149632'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "order_placement_details" DROP CONSTRAINT "FK_order_placement_details_color"`);
        await queryRunner.query(`ALTER TABLE "order_placement_details" DROP CONSTRAINT "FK_order_placement_details_created_by"`);
        await queryRunner.query(`ALTER TABLE "order_placement_details" DROP CONSTRAINT "FK_order_placement_details_deleted_by"`);
        await queryRunner.query(`ALTER TABLE "order_placement_details" DROP CONSTRAINT "FK_order_placement_details_job"`);
        await queryRunner.query(`ALTER TABLE "order_placement_details" DROP CONSTRAINT "FK_order_placement_details_job_detail"`);
        await queryRunner.query(`ALTER TABLE "order_placement_details" DROP CONSTRAINT "FK_order_placement_details_master"`);
        await queryRunner.query(`ALTER TABLE "order_placement_details" DROP CONSTRAINT "FK_order_placement_details_po"`);
        await queryRunner.query(`ALTER TABLE "order_placement_details" DROP CONSTRAINT "FK_order_placement_details_size"`);
        await queryRunner.query(`ALTER TABLE "order_placement_details" DROP CONSTRAINT "FK_order_placement_details_style"`);
        await queryRunner.query(`ALTER TABLE "order_placement_details" DROP CONSTRAINT "FK_order_placement_details_updated_by"`);
        await queryRunner.query(`ALTER TABLE "order_placement" DROP CONSTRAINT "FK_order_placement_buyer"`);
        await queryRunner.query(`ALTER TABLE "order_placement" DROP CONSTRAINT "FK_order_placement_created_by"`);
        await queryRunner.query(`ALTER TABLE "order_placement" DROP CONSTRAINT "FK_order_placement_currency"`);
        await queryRunner.query(`ALTER TABLE "order_placement" DROP CONSTRAINT "FK_order_placement_deleted_by"`);
        await queryRunner.query(`ALTER TABLE "order_placement" DROP CONSTRAINT "FK_order_placement_factory_supplier"`);
        await queryRunner.query(`ALTER TABLE "order_placement" DROP CONSTRAINT "FK_order_placement_job"`);
        await queryRunner.query(`ALTER TABLE "order_placement" DROP CONSTRAINT "FK_order_placement_updated_by"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_currency_exchange_rate_code_date"`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_9b27ffd2f4b3e9bdb83660c3f5" ON "currency_exchange_rate" ("currency_code", "currency_date") `);
        await queryRunner.query(`ALTER TABLE "order_placement_details" ADD CONSTRAINT "FK_d0b94965a87cb6a585f83fe8254" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "order_placement_details" ADD CONSTRAINT "FK_6c1ef4b42646fdd6fad6575aabf" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "order_placement_details" ADD CONSTRAINT "FK_3b010ba6c651096fa1bdaf152a2" FOREIGN KEY ("deleted_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "order_placement_details" ADD CONSTRAINT "FK_3ca67e4bb05d169fdfbbfc80881" FOREIGN KEY ("order_placement_id") REFERENCES "order_placement"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "order_placement_details" ADD CONSTRAINT "FK_7fcd35f85afbb7d38b1abbae2d3" FOREIGN KEY ("job_detail_id") REFERENCES "job_details"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "order_placement_details" ADD CONSTRAINT "FK_d778582660b746f16c747f6fc36" FOREIGN KEY ("job_id") REFERENCES "job"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "order_placement_details" ADD CONSTRAINT "FK_7c4a2243ede988b49e7f89af065" FOREIGN KEY ("po_id") REFERENCES "purchase_order"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "order_placement_details" ADD CONSTRAINT "FK_1cfebf283362c3f245df317430b" FOREIGN KEY ("style_id") REFERENCES "styles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "order_placement_details" ADD CONSTRAINT "FK_7a8aaa718f9987a52d788e32c01" FOREIGN KEY ("size_id") REFERENCES "size"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "order_placement_details" ADD CONSTRAINT "FK_18b829f105995d2e9812af674ab" FOREIGN KEY ("color_id") REFERENCES "color"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "order_placement" ADD CONSTRAINT "FK_e7a661197bd4885575f6c28d4f2" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "order_placement" ADD CONSTRAINT "FK_600e791e7f47a4188ba9758808d" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "order_placement" ADD CONSTRAINT "FK_aaa03450bd50c00f7e2833cf88e" FOREIGN KEY ("deleted_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "order_placement" ADD CONSTRAINT "FK_68ed015454c06bd112b0a902c89" FOREIGN KEY ("buyer_id") REFERENCES "buyer"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "order_placement" ADD CONSTRAINT "FK_f00b1da4d29eee86464b6e2b57a" FOREIGN KEY ("job_id") REFERENCES "job"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "order_placement" ADD CONSTRAINT "FK_c7c12bf7ab9c69c86b67ce5bd00" FOREIGN KEY ("currency_id") REFERENCES "currency"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "order_placement" ADD CONSTRAINT "FK_b5c33fbeab2410f7c7043d6407a" FOREIGN KEY ("factory_id") REFERENCES "supplier"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "order_placement" DROP CONSTRAINT "FK_b5c33fbeab2410f7c7043d6407a"`);
        await queryRunner.query(`ALTER TABLE "order_placement" DROP CONSTRAINT "FK_c7c12bf7ab9c69c86b67ce5bd00"`);
        await queryRunner.query(`ALTER TABLE "order_placement" DROP CONSTRAINT "FK_f00b1da4d29eee86464b6e2b57a"`);
        await queryRunner.query(`ALTER TABLE "order_placement" DROP CONSTRAINT "FK_68ed015454c06bd112b0a902c89"`);
        await queryRunner.query(`ALTER TABLE "order_placement" DROP CONSTRAINT "FK_aaa03450bd50c00f7e2833cf88e"`);
        await queryRunner.query(`ALTER TABLE "order_placement" DROP CONSTRAINT "FK_600e791e7f47a4188ba9758808d"`);
        await queryRunner.query(`ALTER TABLE "order_placement" DROP CONSTRAINT "FK_e7a661197bd4885575f6c28d4f2"`);
        await queryRunner.query(`ALTER TABLE "order_placement_details" DROP CONSTRAINT "FK_18b829f105995d2e9812af674ab"`);
        await queryRunner.query(`ALTER TABLE "order_placement_details" DROP CONSTRAINT "FK_7a8aaa718f9987a52d788e32c01"`);
        await queryRunner.query(`ALTER TABLE "order_placement_details" DROP CONSTRAINT "FK_1cfebf283362c3f245df317430b"`);
        await queryRunner.query(`ALTER TABLE "order_placement_details" DROP CONSTRAINT "FK_7c4a2243ede988b49e7f89af065"`);
        await queryRunner.query(`ALTER TABLE "order_placement_details" DROP CONSTRAINT "FK_d778582660b746f16c747f6fc36"`);
        await queryRunner.query(`ALTER TABLE "order_placement_details" DROP CONSTRAINT "FK_7fcd35f85afbb7d38b1abbae2d3"`);
        await queryRunner.query(`ALTER TABLE "order_placement_details" DROP CONSTRAINT "FK_3ca67e4bb05d169fdfbbfc80881"`);
        await queryRunner.query(`ALTER TABLE "order_placement_details" DROP CONSTRAINT "FK_3b010ba6c651096fa1bdaf152a2"`);
        await queryRunner.query(`ALTER TABLE "order_placement_details" DROP CONSTRAINT "FK_6c1ef4b42646fdd6fad6575aabf"`);
        await queryRunner.query(`ALTER TABLE "order_placement_details" DROP CONSTRAINT "FK_d0b94965a87cb6a585f83fe8254"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_9b27ffd2f4b3e9bdb83660c3f5"`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_currency_exchange_rate_code_date" ON "currency_exchange_rate" ("currency_code", "currency_date") `);
        await queryRunner.query(`ALTER TABLE "order_placement" ADD CONSTRAINT "FK_order_placement_updated_by" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "order_placement" ADD CONSTRAINT "FK_order_placement_job" FOREIGN KEY ("job_id") REFERENCES "job"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "order_placement" ADD CONSTRAINT "FK_order_placement_factory_supplier" FOREIGN KEY ("factory_id") REFERENCES "supplier"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "order_placement" ADD CONSTRAINT "FK_order_placement_deleted_by" FOREIGN KEY ("deleted_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "order_placement" ADD CONSTRAINT "FK_order_placement_currency" FOREIGN KEY ("currency_id") REFERENCES "currency"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "order_placement" ADD CONSTRAINT "FK_order_placement_created_by" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "order_placement" ADD CONSTRAINT "FK_order_placement_buyer" FOREIGN KEY ("buyer_id") REFERENCES "buyer"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "order_placement_details" ADD CONSTRAINT "FK_order_placement_details_updated_by" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "order_placement_details" ADD CONSTRAINT "FK_order_placement_details_style" FOREIGN KEY ("style_id") REFERENCES "styles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "order_placement_details" ADD CONSTRAINT "FK_order_placement_details_size" FOREIGN KEY ("size_id") REFERENCES "size"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "order_placement_details" ADD CONSTRAINT "FK_order_placement_details_po" FOREIGN KEY ("po_id") REFERENCES "purchase_order"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "order_placement_details" ADD CONSTRAINT "FK_order_placement_details_master" FOREIGN KEY ("order_placement_id") REFERENCES "order_placement"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "order_placement_details" ADD CONSTRAINT "FK_order_placement_details_job_detail" FOREIGN KEY ("job_detail_id") REFERENCES "job_details"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "order_placement_details" ADD CONSTRAINT "FK_order_placement_details_job" FOREIGN KEY ("job_id") REFERENCES "job"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "order_placement_details" ADD CONSTRAINT "FK_order_placement_details_deleted_by" FOREIGN KEY ("deleted_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "order_placement_details" ADD CONSTRAINT "FK_order_placement_details_created_by" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "order_placement_details" ADD CONSTRAINT "FK_order_placement_details_color" FOREIGN KEY ("color_id") REFERENCES "color"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
