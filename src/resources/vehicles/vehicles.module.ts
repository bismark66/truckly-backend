import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VehiclesService } from './vehicles.service';
import { VehiclesController } from './vehicles.controller';
import { Vehicle } from './entities/vehicle.entity';
import { FleetOwnersModule } from '../fleet-owners/fleet-owners.module';
import { TransportModule } from '../transport/transport.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Vehicle]),
    FleetOwnersModule,
    TransportModule,
  ],
  controllers: [VehiclesController],
  providers: [VehiclesService],
  exports: [VehiclesService],
})
export class VehiclesModule {}
