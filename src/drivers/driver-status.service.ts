import { Injectable, Inject } from '@nestjs/common';
import Redis from 'ioredis';

export enum DriverStatus {
  ONLINE = 'ONLINE',
  OFFLINE = 'OFFLINE',
  ON_TRIP = 'ON_TRIP',
}

const DRIVER_STATUS_KEY = 'driver-status';

/**
 * Service for managing driver status in Redis
 * Status is stored as a Hash: driver-status -> { driverId: status }
 */
@Injectable()
export class DriverStatusService {
  constructor(
    @Inject('REDIS_CLIENT') private readonly redisClient: Redis,
  ) {}

  /**
   * Set driver status
   */
  async setStatus(driverId: string, status: DriverStatus): Promise<void> {
    await this.redisClient.hset(DRIVER_STATUS_KEY, driverId, status);
  }

  /**
   * Get driver status
   */
  async getStatus(driverId: string): Promise<DriverStatus | null> {
    const status = await this.redisClient.hget(DRIVER_STATUS_KEY, driverId);
    return status as DriverStatus | null;
  }

  /**
   * Remove driver status (on disconnect/go offline)
   */
  async removeStatus(driverId: string): Promise<void> {
    await this.redisClient.hdel(DRIVER_STATUS_KEY, driverId);
  }

  /**
   * Get all online drivers
   */
  async getAllDriverStatuses(): Promise<Record<string, DriverStatus>> {
    const statuses = await this.redisClient.hgetall(DRIVER_STATUS_KEY);
    return statuses as Record<string, DriverStatus>;
  }

  /**
   * Get drivers by status
   */
  async getDriversByStatus(status: DriverStatus): Promise<string[]> {
    const allStatuses = await this.getAllDriverStatuses();
    return Object.entries(allStatuses)
      .filter(([_, s]) => s === status)
      .map(([driverId]) => driverId);
  }

  /**
   * Check if driver is online
   */
  async isOnline(driverId: string): Promise<boolean> {
    const status = await this.getStatus(driverId);
    return status === DriverStatus.ONLINE || status === DriverStatus.ON_TRIP;
  }
}
