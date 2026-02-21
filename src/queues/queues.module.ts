import { Module, forwardRef } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { BookingAllocationProcessor } from './processes/booking-allocation.processor';
import { BookingsModule } from '../bookings/bookings.module';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'booking-allocation',
    }),
    forwardRef(() => BookingsModule),
  ],
  providers: [BookingAllocationProcessor],
  exports: [BullModule],
})
export class QueuesModule {}
