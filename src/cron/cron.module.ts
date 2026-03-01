import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserSession } from '../auth/entities/user-session.entity';
import { CleanExpiredSessionsCron } from './processors/clean-expired-sessions.cron';

@Module({
  imports: [ScheduleModule, TypeOrmModule.forFeature([UserSession])],
  providers: [CleanExpiredSessionsCron],
  exports: [CleanExpiredSessionsCron],
})
export class CronModule {}
