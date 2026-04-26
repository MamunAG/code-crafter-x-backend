import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRequestedAdminToOrganizationAccessRequests1777150000000 implements MigrationInterface {
    name = 'AddRequestedAdminToOrganizationAccessRequests1777150000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "organization_access_requests" ADD "requested_admin_user_id" uuid`);
        await queryRunner.query(`ALTER TABLE "organization_access_requests" ADD "requested_admin_email" character varying`);
        await queryRunner.query(`ALTER TABLE "organization_access_requests" ADD CONSTRAINT "FK_organization_access_requests_requested_admin_user" FOREIGN KEY ("requested_admin_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_organization_access_requests_pending_admin_unique" ON "organization_access_requests" ("requested_by_user_id", "requested_admin_user_id") WHERE "status" = 'pending' AND "requested_admin_user_id" IS NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "code_crafter_x"."IDX_organization_access_requests_pending_admin_unique"`);
        await queryRunner.query(`ALTER TABLE "organization_access_requests" DROP CONSTRAINT "FK_organization_access_requests_requested_admin_user"`);
        await queryRunner.query(`ALTER TABLE "organization_access_requests" DROP COLUMN "requested_admin_email"`);
        await queryRunner.query(`ALTER TABLE "organization_access_requests" DROP COLUMN "requested_admin_user_id"`);
    }
}
