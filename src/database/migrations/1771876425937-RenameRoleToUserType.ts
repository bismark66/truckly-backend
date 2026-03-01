import { MigrationInterface, QueryRunner } from "typeorm";

export class RenameRoleToUserType1771876425937 implements MigrationInterface {
    name = 'RenameRoleToUserType1771876425937'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" RENAME COLUMN "role" TO "userType"`);
        await queryRunner.query(`ALTER TYPE "public"."user_role_enum" RENAME TO "user_usertype_enum"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TYPE "public"."user_usertype_enum" RENAME TO "user_role_enum"`);
        await queryRunner.query(`ALTER TABLE "user" RENAME COLUMN "userType" TO "role"`);
    }

}
