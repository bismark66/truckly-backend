import { MigrationInterface, QueryRunner } from "typeorm";

export class AddIsGoogleAuthEnabledToUsersTable1771858267076 implements MigrationInterface {
    name = 'AddIsGoogleAuthEnabledToUsersTable1771858267076'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_sessions" DROP CONSTRAINT "FK_USER_SESSIONS_USER"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_USER_SESSIONS_ACCESS_TOKEN"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_USER_SESSIONS_REFRESH_TOKEN"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_USER_SESSIONS_USER_ACTIVE"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_USER_SESSIONS_EXPIRES_AT"`);
        await queryRunner.query(`ALTER TABLE "user" ADD "isGoogleAuthEnabled" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "user_sessions" ALTER COLUMN "created_at" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "user_sessions" ALTER COLUMN "updated_at" SET DEFAULT now()`);
        await queryRunner.query(`CREATE INDEX "IDX_dbc81ff542b1b3366bae195f2a" ON "user_sessions" ("expires_at") `);
        await queryRunner.query(`CREATE INDEX "IDX_2c6e259a9af837c1a7090bdda1" ON "user_sessions" ("user_id", "is_active") `);
        await queryRunner.query(`CREATE INDEX "IDX_69214fd09be67af95c186be26d" ON "user_sessions" ("refresh_token") `);
        await queryRunner.query(`CREATE INDEX "IDX_fbb8d6ab3c6330329d1b9e7947" ON "user_sessions" ("access_token") `);
        await queryRunner.query(`ALTER TABLE "user_sessions" ADD CONSTRAINT "FK_e9658e959c490b0a634dfc54783" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_sessions" DROP CONSTRAINT "FK_e9658e959c490b0a634dfc54783"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_fbb8d6ab3c6330329d1b9e7947"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_69214fd09be67af95c186be26d"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_2c6e259a9af837c1a7090bdda1"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_dbc81ff542b1b3366bae195f2a"`);
        await queryRunner.query(`ALTER TABLE "user_sessions" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "user_sessions" ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "isGoogleAuthEnabled"`);
        await queryRunner.query(`CREATE INDEX "IDX_USER_SESSIONS_EXPIRES_AT" ON "user_sessions" ("expires_at") `);
        await queryRunner.query(`CREATE INDEX "IDX_USER_SESSIONS_USER_ACTIVE" ON "user_sessions" ("user_id", "is_active") `);
        await queryRunner.query(`CREATE INDEX "IDX_USER_SESSIONS_REFRESH_TOKEN" ON "user_sessions" ("refresh_token") `);
        await queryRunner.query(`CREATE INDEX "IDX_USER_SESSIONS_ACCESS_TOKEN" ON "user_sessions" ("access_token") `);
        await queryRunner.query(`ALTER TABLE "user_sessions" ADD CONSTRAINT "FK_USER_SESSIONS_USER" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
