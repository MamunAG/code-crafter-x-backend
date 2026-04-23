import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1776956732274 implements MigrationInterface {
    name = 'Migration1776956732274'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "embellishment" ("created_by_id" uuid, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_by_id" uuid, "updated_at" TIMESTAMP DEFAULT now(), "deleted_at" TIMESTAMP, "id" SERIAL NOT NULL, "name" character varying NOT NULL, "remarks" text, "is_active" character varying(10) NOT NULL DEFAULT 'Y', CONSTRAINT "PK_e029c6f80f9b90439306df055b7" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "embellishment" ADD CONSTRAINT "FK_6bb636c06eccb0268cfecfc5c5f" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "embellishment" ADD CONSTRAINT "FK_eb86598a56cbaf095c02c6fd1c4" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "embellishment" DROP CONSTRAINT "FK_eb86598a56cbaf095c02c6fd1c4"`);
        await queryRunner.query(`ALTER TABLE "embellishment" DROP CONSTRAINT "FK_6bb636c06eccb0268cfecfc5c5f"`);
        await queryRunner.query(`DROP TABLE "embellishment"`);
    }

}
