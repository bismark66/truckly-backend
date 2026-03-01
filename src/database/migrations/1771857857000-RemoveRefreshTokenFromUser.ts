import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class RemoveRefreshTokenFromUser1771857857000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop the refreshToken column from user table as it's now handled by user_sessions table
    const hasColumn = await queryRunner.hasColumn('user', 'refreshToken');
    if (hasColumn) {
      await queryRunner.dropColumn('user', 'refreshToken');
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Recreate the column if migration is rolled back
    await queryRunner.addColumn(
      'user',
      new TableColumn({
        name: 'refreshToken',
        type: 'varchar',
        isNullable: true,
      }),
    );
  }
}
