import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1777877617924 implements MigrationInterface {
    name = 'Migration1777877617924'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "code_crafter_x"."employees_gender_enum" AS ENUM('Male', 'Female', 'Others')`);
        await queryRunner.query(`CREATE TABLE "employees" ("created_by_id" uuid, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_by_id" uuid, "updated_at" TIMESTAMP DEFAULT now(), "deleted_at" TIMESTAMP, "deleted_by_id" uuid, "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "factory_id" uuid NOT NULL, "organization_id" uuid NOT NULL, "employee_code" character varying(100) NOT NULL, "employee_name" character varying(255) NOT NULL, "designation_id" uuid, "department_id" uuid, "phone_no" character varying(50), "email" character varying(255), "gender" "code_crafter_x"."employees_gender_enum", "joining_date" date, "nid_no" character varying(100), "address" text, "remarks" text, "is_active" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_b9535a98350d5b26e7eb0c26af4" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "employees" ADD CONSTRAINT "FK_61ba790b66d5671db7d46094c19" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "employees" ADD CONSTRAINT "FK_e539c9aef9fd2bc3199fa0e2ff4" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "employees" ADD CONSTRAINT "FK_4e94e124e8019e83ae6bcfcba22" FOREIGN KEY ("deleted_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "employees" ADD CONSTRAINT "FK_9220e61ca603c8e89599e95d23b" FOREIGN KEY ("factory_id") REFERENCES "factory"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "employees" ADD CONSTRAINT "FK_3d3bc4729062b93fb56b084d786" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "employees" ADD CONSTRAINT "FK_2de5d6e4fb3345f18bc467017f0" FOREIGN KEY ("designation_id") REFERENCES "hr-designations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "employees" ADD CONSTRAINT "FK_678a3540f843823784b0fe4a4f2" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "employees" DROP CONSTRAINT "FK_678a3540f843823784b0fe4a4f2"`);
        await queryRunner.query(`ALTER TABLE "employees" DROP CONSTRAINT "FK_2de5d6e4fb3345f18bc467017f0"`);
        await queryRunner.query(`ALTER TABLE "employees" DROP CONSTRAINT "FK_3d3bc4729062b93fb56b084d786"`);
        await queryRunner.query(`ALTER TABLE "employees" DROP CONSTRAINT "FK_9220e61ca603c8e89599e95d23b"`);
        await queryRunner.query(`ALTER TABLE "employees" DROP CONSTRAINT "FK_4e94e124e8019e83ae6bcfcba22"`);
        await queryRunner.query(`ALTER TABLE "employees" DROP CONSTRAINT "FK_e539c9aef9fd2bc3199fa0e2ff4"`);
        await queryRunner.query(`ALTER TABLE "employees" DROP CONSTRAINT "FK_61ba790b66d5671db7d46094c19"`);
        await queryRunner.query(`DROP TABLE "employees"`);
        await queryRunner.query(`DROP TYPE "code_crafter_x"."employees_gender_enum"`);
    }

}
