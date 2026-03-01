import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveRedundantExpiresAtColumn1772398081551 implements MigrationInterface {
    name = 'RemoveRedundantExpiresAtColumn1772398081551'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_dbc81ff542b1b3366bae195f2a"`);
        await queryRunner.query(`ALTER TABLE "user_sessions" DROP COLUMN "expires_at"`);
        await queryRunner.query(`CREATE INDEX "IDX_fae70ad603064f07661660e643" ON "user_sessions" ("refresh_token_expires_at") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_fae70ad603064f07661660e643"`);
        await queryRunner.query(`ALTER TABLE "user_sessions" ADD "expires_at" TIMESTAMP NOT NULL`);
        await queryRunner.query(`CREATE INDEX "IDX_dbc81ff542b1b3366bae195f2a" ON "user_sessions" ("expires_at") `);
    }

}
