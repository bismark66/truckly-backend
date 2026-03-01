import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveAccessTokenFromSessions1772396807535 implements MigrationInterface {
    name = 'RemoveAccessTokenFromSessions1772396807535'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_fbb8d6ab3c6330329d1b9e7947"`);
        await queryRunner.query(`ALTER TABLE "user_sessions" DROP CONSTRAINT "UQ_fbb8d6ab3c6330329d1b9e7947c"`);
        await queryRunner.query(`ALTER TABLE "user_sessions" DROP COLUMN "access_token"`);
        await queryRunner.query(`ALTER TABLE "user_sessions" DROP COLUMN "access_token_expires_at"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_sessions" ADD "access_token_expires_at" TIMESTAMP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "user_sessions" ADD "access_token" text NOT NULL`);
        await queryRunner.query(`ALTER TABLE "user_sessions" ADD CONSTRAINT "UQ_fbb8d6ab3c6330329d1b9e7947c" UNIQUE ("access_token")`);
        await queryRunner.query(`CREATE INDEX "IDX_fbb8d6ab3c6330329d1b9e7947" ON "user_sessions" ("access_token") `);
    }

}
