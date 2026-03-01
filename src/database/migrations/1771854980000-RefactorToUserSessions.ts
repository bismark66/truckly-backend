import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableIndex,
  TableForeignKey,
} from 'typeorm';

export class RefactorToUserSessions1771854980000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop the old refresh_tokens table if it exists
    const hasRefreshTokensTable = await queryRunner.hasTable('refresh_tokens');
    if (hasRefreshTokensTable) {
      const refreshTokensTable = await queryRunner.getTable('refresh_tokens');
      if (refreshTokensTable) {
        const foreignKeys = refreshTokensTable.foreignKeys;

        // Drop foreign keys first
        for (const fk of foreignKeys) {
          await queryRunner.dropForeignKey('refresh_tokens', fk);
        }
      }

      // Drop the table
      await queryRunner.dropTable('refresh_tokens');
    }

    // Create the new user_sessions table
    await queryRunner.createTable(
      new Table({
        name: 'user_sessions',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'user_id',
            type: 'uuid',
          },
          {
            name: 'access_token',
            type: 'text',
            isUnique: true,
          },
          {
            name: 'refresh_token',
            type: 'text',
            isUnique: true,
          },
          {
            name: 'access_token_expires_at',
            type: 'timestamp',
          },
          {
            name: 'refresh_token_expires_at',
            type: 'timestamp',
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
          },
          {
            name: 'device_info',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'ip_address',
            type: 'varchar',
            length: '45',
            isNullable: true,
          },
          {
            name: 'user_agent',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'last_used_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'revoked_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'expires_at',
            type: 'timestamp',
          },
          {
            name: 'revoke_reason',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
        ],
      }),
      true,
    );

    // Create indexes for performance
    await queryRunner.createIndex(
      'user_sessions',
      new TableIndex({
        name: 'IDX_USER_SESSIONS_ACCESS_TOKEN',
        columnNames: ['access_token'],
      }),
    );

    await queryRunner.createIndex(
      'user_sessions',
      new TableIndex({
        name: 'IDX_USER_SESSIONS_REFRESH_TOKEN',
        columnNames: ['refresh_token'],
      }),
    );

    await queryRunner.createIndex(
      'user_sessions',
      new TableIndex({
        name: 'IDX_USER_SESSIONS_USER_ACTIVE',
        columnNames: ['user_id', 'is_active'],
      }),
    );

    await queryRunner.createIndex(
      'user_sessions',
      new TableIndex({
        name: 'IDX_USER_SESSIONS_EXPIRES_AT',
        columnNames: ['expires_at'],
      }),
    );

    // Create foreign key to users table
    await queryRunner.createForeignKey(
      'user_sessions',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedTableName: 'user',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
        name: 'FK_USER_SESSIONS_USER',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop the user_sessions table
    const hasUserSessionsTable = await queryRunner.hasTable('user_sessions');
    if (hasUserSessionsTable) {
      const userSessionsTable = await queryRunner.getTable('user_sessions');
      if (userSessionsTable) {
        const foreignKeys = userSessionsTable.foreignKeys;

        // Drop foreign keys first
        for (const fk of foreignKeys) {
          await queryRunner.dropForeignKey('user_sessions', fk);
        }
      }

      // Drop the table
      await queryRunner.dropTable('user_sessions');
    }

    // Recreate the old refresh_tokens table (for rollback)
    await queryRunner.createTable(
      new Table({
        name: 'refresh_tokens',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'token',
            type: 'text',
            isUnique: true,
          },
          {
            name: 'user_id',
            type: 'uuid',
          },
          {
            name: 'expires_at',
            type: 'timestamp',
          },
          {
            name: 'is_revoked',
            type: 'boolean',
            default: false,
          },
          {
            name: 'device_info',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'ip_address',
            type: 'varchar',
            length: '45',
            isNullable: true,
          },
          {
            name: 'user_agent',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'revoked_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'replaced_by_token',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'last_used_at',
            type: 'timestamp',
            isNullable: true,
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'refresh_tokens',
      new TableIndex({
        name: 'IDX_REFRESH_TOKEN',
        columnNames: ['token'],
      }),
    );

    await queryRunner.createIndex(
      'refresh_tokens',
      new TableIndex({
        name: 'IDX_USER_REVOKED',
        columnNames: ['user_id', 'is_revoked'],
      }),
    );

    await queryRunner.createForeignKey(
      'refresh_tokens',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedTableName: 'user',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
  }
}
