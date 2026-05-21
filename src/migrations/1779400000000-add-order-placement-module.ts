import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOrderPlacementModule1779400000000 implements MigrationInterface {
  name = 'AddOrderPlacementModule1779400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "order_placement" ("created_by_id" uuid, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_by_id" uuid, "updated_at" TIMESTAMP DEFAULT now(), "deleted_at" TIMESTAMP, "deleted_by_id" uuid, "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "buyer_id" uuid NOT NULL, "job_id" uuid NOT NULL, "currency_id" integer NOT NULL, "placement_date" date NOT NULL, "factory_id" uuid NOT NULL, "is_placed" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_order_placement" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "order_placement_details" ("created_by_id" uuid, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_by_id" uuid, "updated_at" TIMESTAMP DEFAULT now(), "deleted_at" TIMESTAMP, "deleted_by_id" uuid, "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "order_placement_id" uuid NOT NULL, "job_detail_id" uuid, "job_id" uuid NOT NULL, "po_id" uuid NOT NULL, "style_id" uuid NOT NULL, "size_id" integer NOT NULL, "color_id" integer NOT NULL, "quantity" numeric(18,4) NOT NULL DEFAULT '0', "fob" numeric(18,4) NOT NULL DEFAULT '0', "cm_per_dzn" numeric(18,4) NOT NULL DEFAULT '0', "delivery_date" date, "cutting_limit_percentage" numeric(18,4) NOT NULL DEFAULT '0', "remarks" text, "factory_cm" numeric(18,4) NOT NULL DEFAULT '0', "factory_fob" numeric(18,4) NOT NULL DEFAULT '0', "factory_shipment_date" date, "total_factory_cm" numeric(18,4) NOT NULL DEFAULT '0', "total_factory_fob" numeric(18,4) NOT NULL DEFAULT '0', CONSTRAINT "PK_order_placement_details" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_placement" ADD CONSTRAINT "FK_order_placement_created_by" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_placement" ADD CONSTRAINT "FK_order_placement_updated_by" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_placement" ADD CONSTRAINT "FK_order_placement_deleted_by" FOREIGN KEY ("deleted_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_placement" ADD CONSTRAINT "FK_order_placement_buyer" FOREIGN KEY ("buyer_id") REFERENCES "buyer"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_placement" ADD CONSTRAINT "FK_order_placement_job" FOREIGN KEY ("job_id") REFERENCES "job"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_placement" ADD CONSTRAINT "FK_order_placement_currency" FOREIGN KEY ("currency_id") REFERENCES "currency"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_placement" ADD CONSTRAINT "FK_order_placement_factory_supplier" FOREIGN KEY ("factory_id") REFERENCES "supplier"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_placement_details" ADD CONSTRAINT "FK_order_placement_details_created_by" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_placement_details" ADD CONSTRAINT "FK_order_placement_details_updated_by" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_placement_details" ADD CONSTRAINT "FK_order_placement_details_deleted_by" FOREIGN KEY ("deleted_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_placement_details" ADD CONSTRAINT "FK_order_placement_details_master" FOREIGN KEY ("order_placement_id") REFERENCES "order_placement"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_placement_details" ADD CONSTRAINT "FK_order_placement_details_job_detail" FOREIGN KEY ("job_detail_id") REFERENCES "job_details"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_placement_details" ADD CONSTRAINT "FK_order_placement_details_job" FOREIGN KEY ("job_id") REFERENCES "job"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_placement_details" ADD CONSTRAINT "FK_order_placement_details_po" FOREIGN KEY ("po_id") REFERENCES "purchase_order"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_placement_details" ADD CONSTRAINT "FK_order_placement_details_style" FOREIGN KEY ("style_id") REFERENCES "styles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_placement_details" ADD CONSTRAINT "FK_order_placement_details_size" FOREIGN KEY ("size_id") REFERENCES "size"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_placement_details" ADD CONSTRAINT "FK_order_placement_details_color" FOREIGN KEY ("color_id") REFERENCES "color"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "order_placement_details" DROP CONSTRAINT "FK_order_placement_details_color"`);
    await queryRunner.query(`ALTER TABLE "order_placement_details" DROP CONSTRAINT "FK_order_placement_details_size"`);
    await queryRunner.query(`ALTER TABLE "order_placement_details" DROP CONSTRAINT "FK_order_placement_details_style"`);
    await queryRunner.query(`ALTER TABLE "order_placement_details" DROP CONSTRAINT "FK_order_placement_details_po"`);
    await queryRunner.query(`ALTER TABLE "order_placement_details" DROP CONSTRAINT "FK_order_placement_details_job"`);
    await queryRunner.query(`ALTER TABLE "order_placement_details" DROP CONSTRAINT "FK_order_placement_details_job_detail"`);
    await queryRunner.query(`ALTER TABLE "order_placement_details" DROP CONSTRAINT "FK_order_placement_details_master"`);
    await queryRunner.query(`ALTER TABLE "order_placement_details" DROP CONSTRAINT "FK_order_placement_details_deleted_by"`);
    await queryRunner.query(`ALTER TABLE "order_placement_details" DROP CONSTRAINT "FK_order_placement_details_updated_by"`);
    await queryRunner.query(`ALTER TABLE "order_placement_details" DROP CONSTRAINT "FK_order_placement_details_created_by"`);
    await queryRunner.query(`ALTER TABLE "order_placement" DROP CONSTRAINT "FK_order_placement_factory_supplier"`);
    await queryRunner.query(`ALTER TABLE "order_placement" DROP CONSTRAINT "FK_order_placement_currency"`);
    await queryRunner.query(`ALTER TABLE "order_placement" DROP CONSTRAINT "FK_order_placement_job"`);
    await queryRunner.query(`ALTER TABLE "order_placement" DROP CONSTRAINT "FK_order_placement_buyer"`);
    await queryRunner.query(`ALTER TABLE "order_placement" DROP CONSTRAINT "FK_order_placement_deleted_by"`);
    await queryRunner.query(`ALTER TABLE "order_placement" DROP CONSTRAINT "FK_order_placement_updated_by"`);
    await queryRunner.query(`ALTER TABLE "order_placement" DROP CONSTRAINT "FK_order_placement_created_by"`);
    await queryRunner.query(`DROP TABLE "order_placement_details"`);
    await queryRunner.query(`DROP TABLE "order_placement"`);
  }
}
