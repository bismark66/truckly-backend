import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DriverEarningsService } from './driver-earnings.service';
import { DriverEarningsController } from './driver-earnings.controller';
import { DriverEarning } from './entities/driver-earning.entity';

@Module({
  imports: [TypeOrmModule.forFeature([DriverEarning])],
  controllers: [DriverEarningsController],
  providers: [DriverEarningsService],
  exports: [DriverEarningsService],
})
export class DriverEarningsModule {}