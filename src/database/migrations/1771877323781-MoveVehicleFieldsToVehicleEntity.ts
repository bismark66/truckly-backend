import { MigrationInterface, QueryRunner } from "typeorm";

export class MoveVehicleFieldsToVehicleEntity1771877323781 implements MigrationInterface {
    name = 'MoveVehicleFieldsToVehicleEntity1771877323781'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "driver" DROP COLUMN "vehicleCapacity"`);
        await queryRunner.query(`ALTER TABLE "driver" DROP COLUMN "vehicleVolume"`);
        await queryRunner.query(`ALTER TABLE "driver" DROP COLUMN "hasFlatbed"`);
        await queryRunner.query(`ALTER TABLE "driver" DROP COLUMN "hasDumpCapability"`);
        await queryRunner.query(`ALTER TABLE "driver" DROP COLUMN "passengerSeats"`);
        await queryRunner.query(`ALTER TABLE "driver" ADD "isProfileCompleted" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "driver" ADD "referralCode" text`);
        await queryRunner.query(`ALTER TABLE "vehicle" ADD "vehicleCapacity" double precision`);
        await queryRunner.query(`ALTER TABLE "vehicle" ADD "vehicleVolume" double precision`);
        await queryRunner.query(`ALTER TABLE "vehicle" ADD "hasFlatbed" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "vehicle" ADD "hasDumpCapability" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "vehicle" ADD "passengerSeats" integer`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "vehicle" DROP COLUMN "passengerSeats"`);
        await queryRunner.query(`ALTER TABLE "vehicle" DROP COLUMN "hasDumpCapability"`);
        await queryRunner.query(`ALTER TABLE "vehicle" DROP COLUMN "hasFlatbed"`);
        await queryRunner.query(`ALTER TABLE "vehicle" DROP COLUMN "vehicleVolume"`);
        await queryRunner.query(`ALTER TABLE "vehicle" DROP COLUMN "vehicleCapacity"`);
        await queryRunner.query(`ALTER TABLE "driver" DROP COLUMN "referralCode"`);
        await queryRunner.query(`ALTER TABLE "driver" DROP COLUMN "isProfileCompleted"`);
        await queryRunner.query(`ALTER TABLE "driver" ADD "passengerSeats" integer`);
        await queryRunner.query(`ALTER TABLE "driver" ADD "hasDumpCapability" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "driver" ADD "hasFlatbed" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "driver" ADD "vehicleVolume" double precision`);
        await queryRunner.query(`ALTER TABLE "driver" ADD "vehicleCapacity" double precision`);
    }

}
