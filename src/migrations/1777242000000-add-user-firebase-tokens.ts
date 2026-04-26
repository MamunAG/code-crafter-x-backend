import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserFirebaseTokens1777242000000 implements MigrationInterface {
  name = 'AddUserFirebaseTokens1777242000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "user_firebase_tokens" (
        "created_by_id" character varying,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_by_id" character varying,
        "updated_at" TIMESTAMP DEFAULT now(),
        "deleted_at" TIMESTAMP,
        "deleted_by_id" character varying,
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "token" text NOT NULL,
        "platform" character varying,
        "user_agent" text,
        "last_seen_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_user_firebase_tokens_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_user_firebase_tokens_user" ON "user_firebase_tokens" ("user_id")`);
    await queryRunner.query(`CREATE UNIQUE INDEX "UQ_user_firebase_tokens_token" ON "user_firebase_tokens" ("token")`);
    await queryRunner.query(`
      ALTER TABLE "user_firebase_tokens"
      ADD CONSTRAINT "FK_user_firebase_tokens_user"
      FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user_firebase_tokens" DROP CONSTRAINT "FK_user_firebase_tokens_user"`);
    await queryRunner.query(`DROP INDEX "UQ_user_firebase_tokens_token"`);
    await queryRunner.query(`DROP INDEX "IDX_user_firebase_tokens_user"`);
    await queryRunner.query(`DROP TABLE "user_firebase_tokens"`);
  }
}
