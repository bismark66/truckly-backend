import { Injectable, Inject } from '@nestjs/common';
import Redis from 'ioredis';

export enum BookingAllocationStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  TIMEOUT = 'TIMEOUT',
  CANCELLED = 'CANCELLED',
}

@Injectable()
export class BookingStateService {
  constructor(
    @Inject('REDIS_CLIENT')
    private readonly redisClient: Redis,
  ) {}

  /**
   * Set the drivers that were notified for a booking
   */
  async setPendingDrivers(
    bookingId: string,
    driverIds: string[],
  ): Promise<void> {
    const key = `booking:${bookingId}:pending_drivers`;
    if (driverIds.length > 0) {
      await this.redisClient.sadd(key, ...driverIds);
      // Expire after 5 minutes
      await this.redisClient.expire(key, 300);
    }
  }

  /**
   * Remove a driver from the pending list (when they reject or timeout)
   */
  async removeDriver(bookingId: string, driverId: string): Promise<void> {
    const key = `booking:${bookingId}:pending_drivers`;
    await this.redisClient.srem(key, driverId);
  }

  /**
   * Get all pending drivers for a booking
   */
  async getPendingDrivers(bookingId: string): Promise<string[]> {
    const key = `booking:${bookingId}:pending_drivers`;
    return this.redisClient.smembers(key);
  }

  /**
   * Check if a driver is still pending for this booking
   */
  async isDriverPending(bookingId: string, driverId: string): Promise<boolean> {
    const key = `booking:${bookingId}:pending_drivers`;
    const result = await this.redisClient.sismember(key, driverId);
    return result === 1;
  }

  /**
   * Set the allocation status of a booking
   */
  async setAllocationStatus(
    bookingId: string,
    status: BookingAllocationStatus,
    acceptedDriverId?: string,
  ): Promise<void> {
    const key = `booking:${bookingId}:status`;
    const data = acceptedDriverId
      ? JSON.stringify({ status, acceptedDriverId })
      : JSON.stringify({ status });

    await this.redisClient.set(key, data, 'EX', 300); // 5 minutes expiry
  }

  /**
   * Get the allocation status of a booking
   */
  async getAllocationStatus(bookingId: string): Promise<{
    status: BookingAllocationStatus;
    acceptedDriverId?: string;
  } | null> {
    const key = `booking:${bookingId}:status`;
    const data = await this.redisClient.get(key);
    return data ? JSON.parse(data) : null;
  }

  /**
   * Acquire a lock for booking acceptance (prevents race conditions)
   */
  async lockBooking(bookingId: string, driverId: string): Promise<boolean> {
    const key = `booking:${bookingId}:lock`;
    // Try to set the key only if it doesn't exist (NX), with 30 second expiry
    const result = await this.redisClient.set(key, driverId, 'EX', 30, 'NX');
    return result === 'OK';
  }

  /**
   * Release booking lock
   */
  async unlockBooking(bookingId: string): Promise<void> {
    const key = `booking:${bookingId}:lock`;
    await this.redisClient.del(key);
  }

  /**
   * Set the current pending booking request for a driver
   */
  async setDriverPendingRequest(
    driverId: string,
    bookingId: string,
  ): Promise<void> {
    const key = `driver:${driverId}:pending_request`;
    await this.redisClient.set(key, bookingId, 'EX', 300); // 5 minutes
  }

  /**
   * Get the current pending booking request for a driver
   */
  async getDriverPendingRequest(driverId: string): Promise<string | null> {
    const key = `driver:${driverId}:pending_request`;
    return this.redisClient.get(key);
  }

  /**
   * Clear the driver's pending request
   */
  async clearDriverPendingRequest(driverId: string): Promise<void> {
    const key = `driver:${driverId}:pending_request`;
    await this.redisClient.del(key);
  }

  /**
   * Clear all booking state (call after acceptance or final timeout)
   */
  async clearBookingState(bookingId: string): Promise<void> {
    const keys = [
      `booking:${bookingId}:pending_drivers`,
      `booking:${bookingId}:status`,
      `booking:${bookingId}:lock`,
    ];
    await this.redisClient.del(...keys);
  }

  /**
   * Store the list of drivers that were contacted (for tracking/analytics)
   */
  async storeContactedDrivers(
    bookingId: string,
    driverIds: string[],
  ): Promise<void> {
    const key = `booking:${bookingId}:contacted_drivers`;
    if (driverIds.length > 0) {
      await this.redisClient.sadd(key, ...driverIds);
      await this.redisClient.expire(key, 86400); // Keep for 24 hours
    }
  }

  /**
   * Get all drivers that were contacted for a booking
   */
  async getContactedDrivers(bookingId: string): Promise<string[]> {
    const key = `booking:${bookingId}:contacted_drivers`;
    return this.redisClient.smembers(key);
  }
}
