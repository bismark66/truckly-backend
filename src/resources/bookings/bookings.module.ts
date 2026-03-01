import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookingsService } from './bookings.service';
import { BookingsController } from './bookings.controller';
import { BookingAllocationService } from './booking-allocation.service';
import { BookingStateService } from './booking-state.service';
import { Booking } from './entities/booking.entity';
import { Driver } from '../drivers/entities/driver.entity';
import { ChatModule } from '../chat/chat.module';
import { TransportModule } from '../transport/transport.module';
import { VehiclesModule } from '../vehicles/vehicles.module';
import { DriversModule } from '../drivers/drivers.module';
import { WebSocketsModule } from '../websockets/websockets.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { RedisModule } from '../../redis/redis.module';
import { QueuesModule } from '../queues/queues.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Booking, Driver]),
    forwardRef(() => QueuesModule),
    ChatModule,
    TransportModule,
    VehiclesModule,
    DriversModule,
    forwardRef(() => WebSocketsModule),
    NotificationsModule,
    RedisModule,
  ],
  controllers: [BookingsController],
  providers: [BookingsService, BookingAllocationService, BookingStateService],
  exports: [BookingsService, BookingAllocationService, BookingStateService],
})
export class BookingsModule {}
