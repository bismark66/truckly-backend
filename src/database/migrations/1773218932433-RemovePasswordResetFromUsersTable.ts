import { MigrationInterface, QueryRunner } from "typeorm";

export class RemovePasswordResetFromUsersTable1773218932433 implements MigrationInterface {
    name = 'RemovePasswordResetFromUsersTable1773218932433'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "resetPasswordToken"`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "resetPasswordExpires"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" ADD "resetPasswordExpires" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "user" ADD "resetPasswordToken" character varying`);
    }

}
