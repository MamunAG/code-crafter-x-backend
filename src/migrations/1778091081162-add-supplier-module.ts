import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSupplierModule1778091081162 implements MigrationInterface {
  name = 'AddSupplierModule1778091081162';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "supplier" ("created_by_id" uuid, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_by_id" uuid, "updated_at" TIMESTAMP DEFAULT now(), "deleted_at" TIMESTAMP, "deleted_by_id" uuid, "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "display_name" character varying NOT NULL, "code" character varying, "contact" character varying, "email" character varying, "address" character varying, "remarks" text, "organization_id" uuid, "is_active" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_32f0b83a7cbe4a0d3e8f42a5b49" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "supplier" ADD CONSTRAINT "FK_6dd7b17f8af3f9a1e4d8bfae6d1" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "supplier" ADD CONSTRAINT "FK_2a4a5d4b6f8b8a3d3b2c2a8a6c1" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "supplier" ADD CONSTRAINT "FK_7b8f4b9f2c2b4d0b9d2a6d4e5f1" FOREIGN KEY ("deleted_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "supplier" ADD CONSTRAINT "FK_1c6b4a6f3e9b4a3b8f4c7d1e2a3" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "supplier" DROP CONSTRAINT "FK_1c6b4a6f3e9b4a3b8f4c7d1e2a3"`,
    );
    await queryRunner.query(
      `ALTER TABLE "supplier" DROP CONSTRAINT "FK_7b8f4b9f2c2b4d0b9d2a6d4e5f1"`,
    );
    await queryRunner.query(
      `ALTER TABLE "supplier" DROP CONSTRAINT "FK_2a4a5d4b6f8b8a3d3b2c2a8a6c1"`,
    );
    await queryRunner.query(
      `ALTER TABLE "supplier" DROP CONSTRAINT "FK_6dd7b17f8af3f9a1e4d8bfae6d1"`,
    );
    await queryRunner.query(`DROP TABLE "supplier"`);
  }
}
