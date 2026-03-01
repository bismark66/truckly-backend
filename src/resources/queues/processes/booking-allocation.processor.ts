import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { QUEUES } from '../../../common/constants/queues.constants';
import { BookingAllocationService } from '../../bookings/booking-allocation.service';

@Processor(QUEUES.BOOKING_ALLOCATION)
export class BookingAllocationProcessor extends WorkerHost {
  private readonly logger = new Logger(BookingAllocationProcessor.name);

  constructor(private bookingAllocationService: BookingAllocationService) {
    super();
  }

  async process(job: Job): Promise<any> {
    this.logger.log(`Processing job ${job.id} of type ${job.name}`);

    switch (job.name) {
      case 'timeout':
        return this.handleTimeout(job);
      default:
        this.logger.warn(`Unknown job type: ${job.name}`);
        return;
    }
  }

  /**
   * Handle booking timeout
   */
  private async handleTimeout(job: Job): Promise<void> {
    const { bookingId } = job.data;
    this.logger.log(`Handling timeout for booking ${bookingId}`);

    try {
      await this.bookingAllocationService.handleTimeout(bookingId);
      this.logger.log(
        `Successfully processed timeout for booking ${bookingId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to process timeout for booking ${bookingId}:`,
        error,
      );
      throw error; // Let Bull retry
    }
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    this.logger.log(`Job ${job.id} completed successfully`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) {
    this.logger.error(`Job ${job.id} failed:`, error);
  }

  @OnWorkerEvent('active')
  onActive(job: Job) {
    this.logger.log(`Job ${job.id} started processing`);
  }
}
