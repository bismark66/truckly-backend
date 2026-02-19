import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FleetOwnersService } from './fleet-owners.service';
import { FleetOwnersController } from './fleet-owners.controller';
import { FleetOwner } from './entities/fleet-owner.entity';

@Module({
  imports: [TypeOrmModule.forFeature([FleetOwner])],
  controllers: [FleetOwnersController],
  providers: [FleetOwnersService],
  exports: [FleetOwnersService],
})
export class FleetOwnersModule {}
