import { MigrationInterface, QueryRunner } from "typeorm";

export class AddEmailVerificationTokens1776963000001 implements MigrationInterface {
    name = 'AddEmailVerificationTokens1776963000001'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "email_verification_tokens" ("id" SERIAL NOT NULL, "email" character varying NOT NULL, "code" character varying NOT NULL, "expiresAt" TIMESTAMP NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "isUsed" boolean NOT NULL DEFAULT false, "userId" uuid, CONSTRAINT "PK_6e2d6d8fd2790b1338b9a4db319" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "email_verification_tokens" ADD CONSTRAINT "FK_4f97f0daef48a53ebd04ab8d5a4" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`CREATE INDEX "IDX_email_verification_tokens_email_used" ON "email_verification_tokens" ("email", "isUsed")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "IDX_email_verification_tokens_email_used"`);
        await queryRunner.query(`ALTER TABLE "email_verification_tokens" DROP CONSTRAINT "FK_4f97f0daef48a53ebd04ab8d5a4"`);
        await queryRunner.query(`DROP TABLE "email_verification_tokens"`);
    }

}
