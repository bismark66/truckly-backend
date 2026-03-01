import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './entities/user.entity';
import { LocationGateway } from '../websockets/location.gateway';
import { DriversModule } from '../drivers/drivers.module';

@Module({
  imports: [TypeOrmModule.forFeature([User]), DriversModule],
  controllers: [UsersController],
  providers: [UsersService, LocationGateway],
  exports: [UsersService],
})
export class UsersModule {}
