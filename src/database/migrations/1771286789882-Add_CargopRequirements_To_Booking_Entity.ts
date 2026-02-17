import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCargopRequirementsToBookingEntity1771286789882 implements MigrationInterface {
    name = 'AddCargopRequirementsToBookingEntity1771286789882'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "vehicle" DROP CONSTRAINT "FK_db28280fda75f1fc8217d5f4480"`);
        await queryRunner.query(`ALTER TABLE "vehicle" RENAME COLUMN "fleetId" TO "fleetOwnerId"`);
        await queryRunner.query(`CREATE TABLE "fleet_owner" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "companyName" character varying NOT NULL, "registrationNumber" character varying, "dotNumber" character varying, "mcNumber" character varying, "fleetSize" character varying, "vehicleTypes" text, "operatingRegions" text, "monthlyLoads" character varying, "isVerified" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "REL_c42b4ced03607fe2c3c1353b70" UNIQUE ("userId"), CONSTRAINT "PK_2e25c92ffd34fcce7d5d506f7c5" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "booking" ADD "cargoRequirements" jsonb`);
        await queryRunner.query(`ALTER TABLE "fleet_owner" ADD CONSTRAINT "FK_c42b4ced03607fe2c3c1353b704" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "vehicle" ADD CONSTRAINT "FK_2624203718306636bc144193886" FOREIGN KEY ("fleetOwnerId") REFERENCES "fleet_owner"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "vehicle" DROP CONSTRAINT "FK_2624203718306636bc144193886"`);
        await queryRunner.query(`ALTER TABLE "fleet_owner" DROP CONSTRAINT "FK_c42b4ced03607fe2c3c1353b704"`);
        await queryRunner.query(`ALTER TABLE "booking" DROP COLUMN "cargoRequirements"`);
        await queryRunner.query(`DROP TABLE "fleet_owner"`);
        await queryRunner.query(`ALTER TABLE "vehicle" RENAME COLUMN "fleetOwnerId" TO "fleetId"`);
        await queryRunner.query(`ALTER TABLE "vehicle" ADD CONSTRAINT "FK_db28280fda75f1fc8217d5f4480" FOREIGN KEY ("fleetId") REFERENCES "fleet"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
