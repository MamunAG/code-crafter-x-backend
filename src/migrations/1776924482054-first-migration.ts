import { MigrationInterface, QueryRunner } from "typeorm";

export class FirstMigration1776924482054 implements MigrationInterface {
    name = 'FirstMigration1776924482054'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "code_crafter_x"."files_file_type_enum" AS ENUM('document', 'receipt', 'photo', 'video', 'audio', 'other')`);
        await queryRunner.query(`CREATE TYPE "code_crafter_x"."files_file_category_enum" AS ENUM('personal', 'financial', 'medical', 'administrative', 'other')`);
        await queryRunner.query(`CREATE TABLE "files" ("id" SERIAL NOT NULL, "file_name" character varying(255) NOT NULL, "original_name" character varying(255) NOT NULL, "file_path" character varying(500) NOT NULL, "file_size" bigint NOT NULL, "mime_type" character varying(100) NOT NULL, "file_type" "code_crafter_x"."files_file_type_enum" NOT NULL DEFAULT 'other', "file_category" "code_crafter_x"."files_file_category_enum" NOT NULL DEFAULT 'other', "uploaded_by" uuid, "uploaded_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "public_url" character varying, CONSTRAINT "PK_6c16b9093a142e0e7613b04a3d9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "code_crafter_x"."users_gender_enum" AS ENUM('male', 'female', 'other')`);
        await queryRunner.query(`CREATE TYPE "code_crafter_x"."users_role_enum" AS ENUM('admin', 'user')`);
        await queryRunner.query(`CREATE TYPE "code_crafter_x"."users_status_enum" AS ENUM('active', 'inactive')`);
        await queryRunner.query(`CREATE TYPE "code_crafter_x"."users_language_enum" AS ENUM('Arabic', 'English')`);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "email" character varying NOT NULL, "phone_no" character varying NOT NULL, "date_of_birth" TIMESTAMP NOT NULL, "gender" "code_crafter_x"."users_gender_enum" NOT NULL, "user_name" character varying NOT NULL, "password" character varying NOT NULL, "file_id" integer, "display_name" character varying NOT NULL, "bio" character varying, "role" "code_crafter_x"."users_role_enum" NOT NULL, "status" "code_crafter_x"."users_status_enum" NOT NULL DEFAULT 'active', "last_seen_at" TIMESTAMP, "language" "code_crafter_x"."users_language_enum" DEFAULT 'English', "is_delete_account" boolean NOT NULL DEFAULT false, "account_delete_at" TIMESTAMP, "is_show_your_birth_date" boolean NOT NULL DEFAULT false, "is_show_your_location_on_profile" boolean NOT NULL DEFAULT false, "is_disable_private_chats" boolean NOT NULL DEFAULT true, "is_enable_notifications" boolean NOT NULL DEFAULT true, "is_Save_your_activity_on_this_device" boolean NOT NULL DEFAULT false, "isSubscribedUser" boolean DEFAULT false, "is_moderation_user" boolean DEFAULT false, "created_by" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_by" character varying, "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "UQ_074a1f262efaca6aba16f7ed920" UNIQUE ("user_name"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "delete_account" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid, "is_irrelevant_content" boolean NOT NULL DEFAULT false, "is_negative_community" boolean NOT NULL DEFAULT false, "is_no_activity" boolean NOT NULL DEFAULT false, "is_too_time_consuming" boolean NOT NULL DEFAULT false, "is_other" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "PK_ebaea94d4cde435c35ca6eba1be" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "file_references" ("id" SERIAL NOT NULL, "file_id" integer NOT NULL, "resource" character varying(50) NOT NULL, "resource_id" integer NOT NULL, "reference_type" character varying(50) NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_29140177cb876eafdee7340dccc" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "users_location" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid, "location" geography(Point,4326) NOT NULL, "latitude" double precision NOT NULL, "longitude" double precision NOT NULL, "area" character varying, "city" character varying, "state" character varying, "country" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "PK_1523fb2aebce55b9e820122ee0e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "idx_userlocation_user_id" ON "users_location" ("user_id") `);
        await queryRunner.query(`CREATE INDEX "idx_userlocation_location" ON "users_location" USING GiST ("location") `);
        await queryRunner.query(`CREATE TYPE "code_crafter_x"."contact_contact_catagory_enum" AS ENUM('Bug Report', 'Feature Request', 'Account Issues', 'Feedback & Suggesttions', 'Partnership Inquiry', 'Payment & Billing', 'Other')`);
        await queryRunner.query(`CREATE TABLE "contact" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "contact_catagory" "code_crafter_x"."contact_contact_catagory_enum" NOT NULL DEFAULT 'Other', "remarks" character varying, "user_id" uuid NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "PK_2cbbe00f59ab6b3bb5b8d19f989" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "refresh_tokens" ("id" SERIAL NOT NULL, "token" character varying NOT NULL, "expiresAt" TIMESTAMP NOT NULL, "userId" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "isRevoked" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_7d8bee0204106019488c4c50ffa" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "password_reset_tokens" ("id" SERIAL NOT NULL, "email" character varying NOT NULL, "code" character varying NOT NULL, "expiresAt" TIMESTAMP NOT NULL, "userId" uuid, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "isUsed" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_d16bebd73e844c48bca50ff8d3d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "files" ADD CONSTRAINT "FK_63c92c51cd7fd95c2d79d709b61" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_a367444399d0404c15d7dffdb02" FOREIGN KEY ("file_id") REFERENCES "files"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "delete_account" ADD CONSTRAINT "FK_e8ee26fe21a97257b332737b17a" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "file_references" ADD CONSTRAINT "FK_2f65aba597220b9e04ce2dd90f8" FOREIGN KEY ("file_id") REFERENCES "files"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "users_location" ADD CONSTRAINT "FK_16957def0e3220fadbf7eece831" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "contact" ADD CONSTRAINT "FK_33d4fc93803e7192e150216fffb" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "refresh_tokens" ADD CONSTRAINT "FK_610102b60fea1455310ccd299de" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "FK_d6a19d4b4f6c62dcd29daa497e2" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "password_reset_tokens" DROP CONSTRAINT "FK_d6a19d4b4f6c62dcd29daa497e2"`);
        await queryRunner.query(`ALTER TABLE "refresh_tokens" DROP CONSTRAINT "FK_610102b60fea1455310ccd299de"`);
        await queryRunner.query(`ALTER TABLE "contact" DROP CONSTRAINT "FK_33d4fc93803e7192e150216fffb"`);
        await queryRunner.query(`ALTER TABLE "users_location" DROP CONSTRAINT "FK_16957def0e3220fadbf7eece831"`);
        await queryRunner.query(`ALTER TABLE "file_references" DROP CONSTRAINT "FK_2f65aba597220b9e04ce2dd90f8"`);
        await queryRunner.query(`ALTER TABLE "delete_account" DROP CONSTRAINT "FK_e8ee26fe21a97257b332737b17a"`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_a367444399d0404c15d7dffdb02"`);
        await queryRunner.query(`ALTER TABLE "files" DROP CONSTRAINT "FK_63c92c51cd7fd95c2d79d709b61"`);
        await queryRunner.query(`DROP TABLE "password_reset_tokens"`);
        await queryRunner.query(`DROP TABLE "refresh_tokens"`);
        await queryRunner.query(`DROP TABLE "contact"`);
        await queryRunner.query(`DROP TYPE "code_crafter_x"."contact_contact_catagory_enum"`);
        await queryRunner.query(`DROP INDEX "code_crafter_x"."idx_userlocation_location"`);
        await queryRunner.query(`DROP INDEX "code_crafter_x"."idx_userlocation_user_id"`);
        await queryRunner.query(`DROP TABLE "users_location"`);
        await queryRunner.query(`DROP TABLE "file_references"`);
        await queryRunner.query(`DROP TABLE "delete_account"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TYPE "code_crafter_x"."users_language_enum"`);
        await queryRunner.query(`DROP TYPE "code_crafter_x"."users_status_enum"`);
        await queryRunner.query(`DROP TYPE "code_crafter_x"."users_role_enum"`);
        await queryRunner.query(`DROP TYPE "code_crafter_x"."users_gender_enum"`);
        await queryRunner.query(`DROP TABLE "files"`);
        await queryRunner.query(`DROP TYPE "code_crafter_x"."files_file_category_enum"`);
        await queryRunner.query(`DROP TYPE "code_crafter_x"."files_file_type_enum"`);
    }

}
