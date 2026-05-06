import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddJobTables1778000000000 implements MigrationInterface {
  name = 'AddJobTables1778000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE "code_crafter_x"."job_ordertype_enum" AS ENUM('Retail', 'Promotional')`);

    await queryRunner.query(`
      CREATE TABLE "purchase_order" (
        "created_by_id" uuid,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_by_id" uuid,
        "updated_at" TIMESTAMP DEFAULT now(),
        "deleted_at" TIMESTAMP,
        "deleted_by_id" uuid,
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "pono" character varying(50) NOT NULL,
        CONSTRAINT "UQ_purchase_order_pono" UNIQUE ("pono"),
        CONSTRAINT "PK_purchase_order_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "job" (
        "created_by_id" uuid,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_by_id" uuid,
        "updated_at" TIMESTAMP DEFAULT now(),
        "deleted_at" TIMESTAMP,
        "deleted_by_id" uuid,
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "factory_id" uuid NOT NULL,
        "buyer_id" uuid NOT NULL,
        "merchandiser_id" uuid,
        "ordertype" "code_crafter_x"."job_ordertype_enum",
        "total_po_qty" numeric(18,4) NOT NULL DEFAULT 0,
        "po_receive_date" date,
        "is_active" boolean NOT NULL DEFAULT true,
        CONSTRAINT "PK_job_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "job_details" (
        "created_by_id" uuid,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_by_id" uuid,
        "updated_at" TIMESTAMP DEFAULT now(),
        "deleted_at" TIMESTAMP,
        "deleted_by_id" uuid,
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "job_id" uuid NOT NULL,
        "po_id" uuid NOT NULL,
        "style_id" uuid NOT NULL,
        "size_id" integer NOT NULL,
        "color_id" integer NOT NULL,
        "quantity" numeric(18,4) NOT NULL DEFAULT 0,
        "fob" numeric(18,4) NOT NULL DEFAULT 0,
        "cm" numeric(18,4) NOT NULL DEFAULT 0,
        "delivery_date" date,
        "remarks" text,
        CONSTRAINT "PK_job_details_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(
      `ALTER TABLE "purchase_order" ADD CONSTRAINT "FK_purchase_order_created_by" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "purchase_order" ADD CONSTRAINT "FK_purchase_order_updated_by" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "purchase_order" ADD CONSTRAINT "FK_purchase_order_deleted_by" FOREIGN KEY ("deleted_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `ALTER TABLE "job" ADD CONSTRAINT "FK_job_created_by" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "job" ADD CONSTRAINT "FK_job_updated_by" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "job" ADD CONSTRAINT "FK_job_deleted_by" FOREIGN KEY ("deleted_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "job" ADD CONSTRAINT "FK_job_factory" FOREIGN KEY ("factory_id") REFERENCES "factory"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "job" ADD CONSTRAINT "FK_job_buyer" FOREIGN KEY ("buyer_id") REFERENCES "buyer"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "job" ADD CONSTRAINT "FK_job_merchandiser" FOREIGN KEY ("merchandiser_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `ALTER TABLE "job_details" ADD CONSTRAINT "FK_job_details_created_by" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "job_details" ADD CONSTRAINT "FK_job_details_updated_by" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "job_details" ADD CONSTRAINT "FK_job_details_deleted_by" FOREIGN KEY ("deleted_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "job_details" ADD CONSTRAINT "FK_job_details_job" FOREIGN KEY ("job_id") REFERENCES "job"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "job_details" ADD CONSTRAINT "FK_job_details_purchase_order" FOREIGN KEY ("po_id") REFERENCES "purchase_order"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "job_details" ADD CONSTRAINT "FK_job_details_style" FOREIGN KEY ("style_id") REFERENCES "styles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "job_details" ADD CONSTRAINT "FK_job_details_size" FOREIGN KEY ("size_id") REFERENCES "size"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "job_details" ADD CONSTRAINT "FK_job_details_color" FOREIGN KEY ("color_id") REFERENCES "color"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "job_details" DROP CONSTRAINT "FK_job_details_color"`);
    await queryRunner.query(`ALTER TABLE "job_details" DROP CONSTRAINT "FK_job_details_size"`);
    await queryRunner.query(`ALTER TABLE "job_details" DROP CONSTRAINT "FK_job_details_style"`);
    await queryRunner.query(`ALTER TABLE "job_details" DROP CONSTRAINT "FK_job_details_purchase_order"`);
    await queryRunner.query(`ALTER TABLE "job_details" DROP CONSTRAINT "FK_job_details_job"`);
    await queryRunner.query(`ALTER TABLE "job_details" DROP CONSTRAINT "FK_job_details_deleted_by"`);
    await queryRunner.query(`ALTER TABLE "job_details" DROP CONSTRAINT "FK_job_details_updated_by"`);
    await queryRunner.query(`ALTER TABLE "job_details" DROP CONSTRAINT "FK_job_details_created_by"`);

    await queryRunner.query(`ALTER TABLE "job" DROP CONSTRAINT "FK_job_buyer"`);
    await queryRunner.query(`ALTER TABLE "job" DROP CONSTRAINT "FK_job_merchandiser"`);
    await queryRunner.query(`ALTER TABLE "job" DROP CONSTRAINT "FK_job_factory"`);
    await queryRunner.query(`ALTER TABLE "job" DROP CONSTRAINT "FK_job_deleted_by"`);
    await queryRunner.query(`ALTER TABLE "job" DROP CONSTRAINT "FK_job_updated_by"`);
    await queryRunner.query(`ALTER TABLE "job" DROP CONSTRAINT "FK_job_created_by"`);

    await queryRunner.query(`ALTER TABLE "purchase_order" DROP CONSTRAINT "FK_purchase_order_deleted_by"`);
    await queryRunner.query(`ALTER TABLE "purchase_order" DROP CONSTRAINT "FK_purchase_order_updated_by"`);
    await queryRunner.query(`ALTER TABLE "purchase_order" DROP CONSTRAINT "FK_purchase_order_created_by"`);

    await queryRunner.query(`DROP TABLE "job_details"`);
    await queryRunner.query(`DROP TABLE "job"`);
    await queryRunner.query(`DROP TABLE "purchase_order"`);
    await queryRunner.query(`DROP TYPE "code_crafter_x"."job_ordertype_enum"`);
  }
}
