import { MigrationInterface, QueryRunner } from "typeorm";

export class AddLicenseFrontAndBackToDriver1772555822075 implements MigrationInterface {
    name = 'AddLicenseFrontAndBackToDriver1772555822075'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."driver_earning_type_enum" AS ENUM('TRIP_COMPLETION', 'BONUS', 'TIP', 'REFERRAL', 'PENALTY')`);
        await queryRunner.query(`CREATE TYPE "public"."driver_earning_status_enum" AS ENUM('PENDING', 'PROCESSED', 'PAID', 'DISPUTED', 'CANCELLED')`);
        await queryRunner.query(`CREATE TABLE "driver_earning" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "driverId" uuid NOT NULL, "tripId" character varying, "type" "public"."driver_earning_type_enum" NOT NULL, "grossAmount" numeric(10,2) NOT NULL, "platformFee" numeric(10,2) NOT NULL DEFAULT '0', "tax" numeric(10,2) NOT NULL DEFAULT '0', "otherDeductions" numeric(10,2) NOT NULL DEFAULT '0', "netAmount" numeric(10,2) NOT NULL, "status" "public"."driver_earning_status_enum" NOT NULL DEFAULT 'PENDING', "earningDate" date NOT NULL, "payoutDate" date, "payoutMethod" character varying, "payoutReference" character varying, "description" text, "notes" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_5dd17e687252d90c23abe49430e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "driver" ADD "licenseFrontPageUrl" character varying`);
        await queryRunner.query(`ALTER TABLE "driver" ADD "licenseBackPageUrl" character varying`);
        await queryRunner.query(`ALTER TABLE "driver_earning" ADD CONSTRAINT "FK_13021c1b1a01a32a51cb19c6c37" FOREIGN KEY ("driverId") REFERENCES "driver"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "driver_earning" DROP CONSTRAINT "FK_13021c1b1a01a32a51cb19c6c37"`);
        await queryRunner.query(`ALTER TABLE "driver" DROP COLUMN "licenseBackPageUrl"`);
        await queryRunner.query(`ALTER TABLE "driver" DROP COLUMN "licenseFrontPageUrl"`);
        await queryRunner.query(`DROP TABLE "driver_earning"`);
        await queryRunner.query(`DROP TYPE "public"."driver_earning_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."driver_earning_type_enum"`);
    }

}
