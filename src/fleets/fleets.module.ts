import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FleetsService } from './fleets.service';
import { FleetsController } from './fleets.controller';
import { Fleet } from './entities/fleet.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Fleet])],
  controllers: [FleetsController],
  providers: [FleetsService],
  exports: [FleetsService],
})
export class FleetsModule {}
