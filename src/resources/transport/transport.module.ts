import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Vehicle } from '../vehicles/entities/vehicle.entity';
import { LogisticsService } from './logistics.service';

/**
 * TransportModule - Provides logistics and transport strategy services
 * Uses factory pattern for intelligent vehicle-cargo matching
 */
@Module({
  imports: [TypeOrmModule.forFeature([Vehicle])],
  providers: [LogisticsService],
  exports: [LogisticsService],
})
export class TransportModule {}
