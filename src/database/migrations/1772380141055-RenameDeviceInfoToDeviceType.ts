import { MigrationInterface, QueryRunner } from "typeorm";

export class RenameDeviceInfoToDeviceType1772380141055 implements MigrationInterface {
    name = 'RenameDeviceInfoToDeviceType1772380141055'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_sessions" RENAME COLUMN "device_info" TO "device_type"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_sessions" RENAME COLUMN "device_type" TO "device_info"`);
    }

}
