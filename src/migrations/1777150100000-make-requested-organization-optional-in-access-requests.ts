import { MigrationInterface, QueryRunner } from 'typeorm';

export class MakeRequestedOrganizationOptionalInAccessRequests1777150100000 implements MigrationInterface {
    name = 'MakeRequestedOrganizationOptionalInAccessRequests1777150100000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "organization_access_requests" ALTER COLUMN "requested_organization_id" DROP NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "organization_access_requests" ALTER COLUMN "requested_organization_id" SET NOT NULL`);
    }
}
