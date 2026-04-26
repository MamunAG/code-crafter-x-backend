import { MigrationInterface, QueryRunner } from "typeorm";

export class AddOrganizationAccessRequestsAndNotifications1777149999999 implements MigrationInterface {
    name = 'AddOrganizationAccessRequestsAndNotifications1777149999999'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "code_crafter_x"."organization_access_requests_status_enum" AS ENUM('pending', 'approved', 'rejected')`);
        await queryRunner.query(`CREATE TYPE "code_crafter_x"."notifications_type_enum" AS ENUM('organization_access_request', 'organization_access_request_decision')`);
        await queryRunner.query(`CREATE TABLE "organization_access_requests" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "requested_by_user_id" uuid NOT NULL, "requested_organization_id" uuid NOT NULL, "message" text, "status" "code_crafter_x"."organization_access_requests_status_enum" NOT NULL DEFAULT 'pending', "reviewed_by_user_id" uuid, "reviewed_at" TIMESTAMP, "review_note" text, "created_by_id" uuid, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_by_id" uuid, "updated_at" TIMESTAMP DEFAULT now(), "deleted_at" TIMESTAMP, "deleted_by_id" uuid, CONSTRAINT "PK_organization_access_requests_id" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_organization_access_requests_pending_unique" ON "organization_access_requests" ("requested_by_user_id", "requested_organization_id") WHERE "status" = 'pending'`);
        await queryRunner.query(`CREATE INDEX "IDX_organization_access_requests_status_created" ON "organization_access_requests" ("status", "created_at")`);
        await queryRunner.query(`CREATE TABLE "notifications" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "title" character varying NOT NULL, "body" text NOT NULL, "link" character varying, "type" "code_crafter_x"."notifications_type_enum" NOT NULL DEFAULT 'organization_access_request', "is_read" boolean NOT NULL DEFAULT false, "read_at" TIMESTAMP, "metadata" jsonb, "created_by_id" uuid, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_by_id" uuid, "updated_at" TIMESTAMP DEFAULT now(), "deleted_at" TIMESTAMP, "deleted_by_id" uuid, CONSTRAINT "PK_notifications_id" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_notifications_user_read" ON "notifications" ("user_id", "is_read")`);
        await queryRunner.query(`ALTER TABLE "organization_access_requests" ADD CONSTRAINT "FK_organization_access_requests_requested_by_user" FOREIGN KEY ("requested_by_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "organization_access_requests" ADD CONSTRAINT "FK_organization_access_requests_requested_organization" FOREIGN KEY ("requested_organization_id") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "organization_access_requests" ADD CONSTRAINT "FK_organization_access_requests_reviewed_by_user" FOREIGN KEY ("reviewed_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "organization_access_requests" ADD CONSTRAINT "FK_organization_access_requests_created_by_user" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "organization_access_requests" ADD CONSTRAINT "FK_organization_access_requests_updated_by_user" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "organization_access_requests" ADD CONSTRAINT "FK_organization_access_requests_deleted_by_user" FOREIGN KEY ("deleted_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "notifications" ADD CONSTRAINT "FK_notifications_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "notifications" ADD CONSTRAINT "FK_notifications_created_by_user" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "notifications" ADD CONSTRAINT "FK_notifications_updated_by_user" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "notifications" ADD CONSTRAINT "FK_notifications_deleted_by_user" FOREIGN KEY ("deleted_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "notifications" DROP CONSTRAINT "FK_notifications_deleted_by_user"`);
        await queryRunner.query(`ALTER TABLE "notifications" DROP CONSTRAINT "FK_notifications_updated_by_user"`);
        await queryRunner.query(`ALTER TABLE "notifications" DROP CONSTRAINT "FK_notifications_created_by_user"`);
        await queryRunner.query(`ALTER TABLE "notifications" DROP CONSTRAINT "FK_notifications_user"`);
        await queryRunner.query(`ALTER TABLE "organization_access_requests" DROP CONSTRAINT "FK_organization_access_requests_deleted_by_user"`);
        await queryRunner.query(`ALTER TABLE "organization_access_requests" DROP CONSTRAINT "FK_organization_access_requests_updated_by_user"`);
        await queryRunner.query(`ALTER TABLE "organization_access_requests" DROP CONSTRAINT "FK_organization_access_requests_created_by_user"`);
        await queryRunner.query(`ALTER TABLE "organization_access_requests" DROP CONSTRAINT "FK_organization_access_requests_reviewed_by_user"`);
        await queryRunner.query(`ALTER TABLE "organization_access_requests" DROP CONSTRAINT "FK_organization_access_requests_requested_organization"`);
        await queryRunner.query(`ALTER TABLE "organization_access_requests" DROP CONSTRAINT "FK_organization_access_requests_requested_by_user"`);
        await queryRunner.query(`DROP INDEX "code_crafter_x"."IDX_notifications_user_read"`);
        await queryRunner.query(`DROP TABLE "notifications"`);
        await queryRunner.query(`DROP INDEX "code_crafter_x"."IDX_organization_access_requests_status_created"`);
        await queryRunner.query(`DROP INDEX "code_crafter_x"."IDX_organization_access_requests_pending_unique"`);
        await queryRunner.query(`DROP TABLE "organization_access_requests"`);
        await queryRunner.query(`DROP TYPE "code_crafter_x"."notifications_type_enum"`);
        await queryRunner.query(`DROP TYPE "code_crafter_x"."organization_access_requests_status_enum"`);
    }
}
