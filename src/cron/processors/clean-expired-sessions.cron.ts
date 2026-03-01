/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { UserSession } from '../../resources/auth/entities/user-session.entity';

@Injectable()
export class CleanExpiredSessionsCron {
  private readonly logger = new Logger(CleanExpiredSessionsCron.name);
  private readonly BATCH_SIZE = 1000;
  private readonly ADVISORY_LOCK_ID = 987654321;

  constructor(
    @InjectRepository(UserSession)
    private readonly userSessionRepository: Repository<UserSession>,
    private readonly dataSource: DataSource,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async handleExpiredSessionsCleanup() {
    this.logger.debug('Starting expired sessions cleanup...');

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();

    try {
      // Acquire advisory lock
      const lockResult = await queryRunner.query(
        `SELECT pg_try_advisory_lock($1)`,
        [this.ADVISORY_LOCK_ID],
      );

      if (!lockResult[0]?.pg_try_advisory_lock) {
        this.logger.debug('Cleanup skipped - another instance holds the lock.');
        return;
      }

      let totalDeleted = 0;

      while (true) {
        const result = await queryRunner.query(
          `
          DELETE FROM user_sessions
          WHERE id IN (
            SELECT id FROM user_sessions
            WHERE refresh_token_expires_at < NOW()
            LIMIT $1
          )
          RETURNING id
          `,
          [this.BATCH_SIZE],
        );

        const deletedCount = result.length;
        totalDeleted += deletedCount;

        if (deletedCount < this.BATCH_SIZE) break;
      }

      this.logger.log(
        `Expired sessions cleanup completed. Total deleted: ${totalDeleted}`,
      );
    } catch (error) {
      this.logger.error('Error during expired sessions cleanup:', error);
    } finally {
      await queryRunner.query(`SELECT pg_advisory_unlock($1)`, [
        this.ADVISORY_LOCK_ID,
      ]);
      await queryRunner.release();
    }
  }
}
