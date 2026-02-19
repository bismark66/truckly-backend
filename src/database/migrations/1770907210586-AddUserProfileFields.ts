import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUserProfileFields1770907210586 implements MigrationInterface {
    name = 'AddUserProfileFields1770907210586'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" ADD "avatar" character varying`);
        await queryRunner.query(`ALTER TABLE "user" ADD "isVerified" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "user" ADD "googleId" character varying`);
        await queryRunner.query(`ALTER TABLE "user" ADD CONSTRAINT "UQ_470355432cc67b2c470c30bef7c" UNIQUE ("googleId")`);
        await queryRunner.query(`ALTER TABLE "user" ADD "refreshToken" character varying`);
        await queryRunner.query(`ALTER TABLE "user" ADD "resetPasswordToken" character varying`);
        await queryRunner.query(`ALTER TABLE "user" ADD "resetPasswordExpires" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "driver" ADD "isOnline" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "driver" ADD "rating" numeric(3,2) NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "driver" ADD "totalTrips" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "driver" ADD "totalEarnings" numeric(10,2) NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "fleet" ADD "dotNumber" character varying`);
        await queryRunner.query(`ALTER TABLE "fleet" ADD "mcNumber" character varying`);
        await queryRunner.query(`ALTER TABLE "fleet" ADD "fleetSize" character varying`);
        await queryRunner.query(`ALTER TABLE "fleet" ADD "vehicleTypes" text`);
        await queryRunner.query(`ALTER TABLE "fleet" ADD "operatingRegions" text`);
        await queryRunner.query(`ALTER TABLE "fleet" ADD "monthlyLoads" character varying`);
        await queryRunner.query(`ALTER TABLE "fleet" ADD "isVerified" boolean NOT NULL DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "fleet" DROP COLUMN "isVerified"`);
        await queryRunner.query(`ALTER TABLE "fleet" DROP COLUMN "monthlyLoads"`);
        await queryRunner.query(`ALTER TABLE "fleet" DROP COLUMN "operatingRegions"`);
        await queryRunner.query(`ALTER TABLE "fleet" DROP   "vehicleTypes"`);
        await queryRunner.query(`ALTER TABLE "fleet" DROP COLUMN "fleetSize"`);
        await queryRunner.query(`ALTER TABLE "fleet" DROP COLUMN "mcNumber"`);
        await queryRunner.query(`ALTER TABLE "fleet" DROP COLUMN "dotNumber"`);
        await queryRunner.query(`ALTER TABLE "driver" DROP COLUMN "totalEarnings"`);
        await queryRunner.query(`ALTER TABLE "driver" DROP COLUMN "totalTrips"`);
        await queryRunner.query(`ALTER TABLE "driver" DROP COLUMN "rating"`);
        await queryRunner.query(`ALTER TABLE "driver" DROP COLUMN "isOnline"`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "resetPasswordExpires"`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "resetPasswordToken"`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "refreshToken"`);
        await queryRunner.query(`ALTER TABLE "user" DROP CONSTRAINT "UQ_470355432cc67b2c470c30bef7c"`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "googleId"`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "isVerified"`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "avatar"`);
    }

}
