import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFcmTokens1771288500000 implements MigrationInterface {
  name = 'AddFcmTokens1771288500000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "driver" ADD "fcmToken" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD "fcmToken" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "fcmToken"`);
    await queryRunner.query(`ALTER TABLE "driver" DROP COLUMN "fcmToken"`);
  }
}
