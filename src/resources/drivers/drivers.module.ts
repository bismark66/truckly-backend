import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DriversService } from './drivers.service';
import { DriversController } from './drivers.controller';
import { Driver } from './entities/driver.entity';
import { DriverStatusService } from './driver-status.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [TypeOrmModule.forFeature([Driver]), NotificationsModule],
  controllers: [DriversController],
  providers: [DriversService, DriverStatusService],
  exports: [DriversService, DriverStatusService],
})
export class DriversModule {}
