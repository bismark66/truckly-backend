/* eslint-disable @typescript-eslint/no-unsafe-member-access */

import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bullmq';
import { Booking, BookingStatus } from './entities/booking.entity';
import { Driver } from '../drivers/entities/driver.entity';
import { DriversService } from '../drivers/drivers.service';
import { LogisticsService } from '../transport/logistics.service';
import { LocationGateway } from '../websockets/location.gateway';
import { BookingGateway } from '../websockets/booking.gateway';
import { NotificationsService } from '../notifications/notifications.service';
import {
  BookingStateService,
  BookingAllocationStatus,
} from './booking-state.service';
import { CargoRequirements } from '../transport/factory';

export interface MatchedDriver {
  driver: Driver;
  distance: number;
  matchScore: number;
  vehicleId: string;
}

@Injectable()
export class BookingAllocationService {
  private readonly logger = new Logger(BookingAllocationService.name);

  constructor(
    @InjectRepository(Booking)
    private bookingsRepository: Repository<Booking>,
    @InjectRepository(Driver)
    private driversRepository: Repository<Driver>,
    private driversService: DriversService,
    private logisticsService: LogisticsService,
    @Inject(forwardRef(() => LocationGateway))
    private locationGateway: LocationGateway,
    @Inject(forwardRef(() => BookingGateway))
    private bookingGateway: BookingGateway,
    private notificationsService: NotificationsService,
    private bookingStateService: BookingStateService,
    @InjectQueue('booking-allocation')
    private bookingQueue: Queue,
  ) {}

  /**
   * Find matching drivers based on location and cargo requirements
   * Combines geospatial search with vehicle/cargo validation
   */
  async findMatchingDrivers(
    booking: Booking,
    limit: number = 3,
  ): Promise<MatchedDriver[]> {
    // Extract pickup location coordinates
    this.logger.log(
      `Finding drivers near lat: ${booking.pickupLocation?.lat}, lng: ${booking.pickupLocation?.lng}`,
    );
    const pickupLat = booking.pickupLocation?.lat;
    const pickupLng = booking.pickupLocation?.lng;

    if (!pickupLat || !pickupLng) {
      throw new BadRequestException('Pickup location coordinates are required');
    }

    // Find nearby drivers using LocationGateway for geospatial queries
    // BookingGateway is used only for booking-related WebSocket events
    const nearbyDrivers = await this.locationGateway.findClosestDriver(
      pickupLat,
      pickupLng,
      10, // 10km radius, configurable
    );

    this.logger.log(`Nearby drivers result: ${JSON.stringify(nearbyDrivers)}`);

    if (!nearbyDrivers || nearbyDrivers.length === 0) {
      this.logger.warn('No online drivers found nearby');
      return [];
    }

    this.logger.log(`Found ${nearbyDrivers.length} nearby online drivers`);

    // Fetch driver details from database
    const driverIds = nearbyDrivers.map((nd) => nd.driverId);
    const drivers = await this.driversRepository.find({
      where: { id: In(driverIds) },
      relations: ['user'],
    });

    this.logger.log(`Retrieved ${drivers.length} driver records from database`);

    // If no cargo requirements, return all nearby drivers
    if (!booking.cargoRequirements) {
      const matches: MatchedDriver[] = [];

      this.logger.log(
        'returning all nearby drivers since no cargo requirements specified',
        matches,
      );

      for (const driver of drivers) {
        const nearbyDriver = nearbyDrivers.find(
          (nd) => nd.driverId === driver.id,
        );
        if (nearbyDriver) {
          matches.push({
            driver,
            distance: nearbyDriver.distance,
            matchScore: 100, // Default score when no cargo requirements
            vehicleId: driver.id, // Using driver ID as vehicle reference
          });
        }
      }

      return matches.slice(0, limit);
    }

    // Validate cargo requirements against each driver's vehicle
    const matches: MatchedDriver[] = [];

    for (const driver of drivers) {
      try {
        this.logger.log(
          `Validating driver ${driver.id} - Vehicle: ${driver.vehicleType} against cargo requirements: ${JSON.stringify(
            booking.cargoRequirements,
          )}`,
        );

        // Validate driver's vehicle against cargo requirements using driver entity directly
        const validation = this.logisticsService.validateDriverVehicle(
          driver,
          booking.cargoRequirements,
        );

        this.logger.log(
          `Driver ${driver.id} validation result: ${JSON.stringify(
            validation,
          )}`,
        );

        if (validation.canHandle) {
          const nearbyDriver = nearbyDrivers.find(
            (nd) => nd.driverId === driver.id,
          );
          const distance = nearbyDriver ? nearbyDriver.distance : 0;

          matches.push({
            driver,
            distance,
            matchScore: validation.matchScore,
            vehicleId: driver.id, // Using driver ID as vehicle reference
          });

          this.logger.log(
            `✅ Driver ${driver.id} matched - Vehicle: ${driver.vehicleType}, Score: ${validation.matchScore}, Distance: ${distance}km`,
          );
        } else {
          this.logger.debug(
            `❌ Driver ${driver.id} cannot handle cargo: ${validation.reason}`,
          );
        }
      } catch (error: any) {
        this.logger.warn(
          `Failed to validate driver ${driver.id}: ${error.message}`,
        );
        continue;
      }
    }

    // Sort by combined score: match score (70%) + distance score (30%)
    matches.sort((a, b) => {
      const scoreA =
        a.matchScore * 0.7 + (100 - Math.min(a.distance * 10, 100)) * 0.3;
      const scoreB =
        b.matchScore * 0.7 + (100 - Math.min(b.distance * 10, 100)) * 0.3;
      return scoreB - scoreA;
    });

    return matches;
  }

  /**
   * Send booking requests to multiple drivers simultaneously (batch)
   * First to accept wins
   */
  async sendBatchRequest(
    booking: Booking,
    drivers: MatchedDriver[],
  ): Promise<void> {
    if (drivers.length === 0) {
      throw new BadRequestException('No drivers available for this booking');
    }
    console.log('send batch booking', booking);

    // Use User IDs for WebSocket operations and Redis state tracking
    const userIds = drivers.map((d) => d.driver.userId);

    // Store pending drivers in Redis (using User IDs for WebSocket compatibility)
    await this.bookingStateService.setPendingDrivers(booking.id, userIds);
    await this.bookingStateService.storeContactedDrivers(booking.id, userIds);
    await this.bookingStateService.setAllocationStatus(
      booking.id,
      BookingAllocationStatus.PENDING,
    );

    this.logger.log(
      `Booking ${booking.id} sent to ${userIds.length} drivers for allocation`,
    );

    // Send notifications to all drivers simultaneously
    const notificationPromises = drivers.map(async (matchedDriver) => {
      const driver = matchedDriver.driver;

      // Set driver's pending request (using User ID for WebSocket compatibility)
      await this.bookingStateService.setDriverPendingRequest(
        driver.userId,
        booking.id,
      );

      // Add driver to booking-specific room (using User ID)
      this.bookingGateway.addDriverToBookingRoom(driver.userId, booking.id);

      // Send WebSocket notification (if connected) - using User ID for room
      try {
        const server = this.bookingGateway.server;
        server.to(`driver_${driver.userId}`).emit('bookingRequest', {
          bookingId: booking.id,
          pickupLocation: booking.pickupLocation,
          dropoffLocation: booking.dropoffLocation,
          cargoRequirements: booking.cargoRequirements,
          price: booking.price,
          type: booking.type,
          distance: matchedDriver.distance,
          matchScore: matchedDriver.matchScore,
        });
        this.logger.log(`Sent WebSocket notification to driver ${driver.id}`);
      } catch (error) {
        this.logger.warn(
          `Failed to send WebSocket to driver ${driver.id}: ${error.message}`,
        );
      }

      // Send FCM push notification
      try {
        await this.notificationsService.sendBookingRequest(driver.id, booking);
        this.logger.log(`Sent FCM notification to driver ${driver.id}`);
      } catch (error) {
        this.logger.warn(
          `Failed to send FCM to driver ${driver.id}: ${error.message}`,
        );
      }
    });

    await Promise.all(notificationPromises);

    // Schedule timeout job
    await this.bookingQueue.add(
      'timeout',
      { bookingId: booking.id },
      {
        delay: 60000, // 60 seconds
        jobId: `booking-timeout-${booking.id}`,
      },
    );

    this.logger.log(
      `Sent booking ${booking.id} to ${drivers.length} drivers with 60s timeout`,
    );
  }

  /**
   * Handle driver response (accept or reject)
   * @param driverId - User ID (from JWT/WebSocket)
   */
  async handleDriverResponse(
    bookingId: string,
    driverId: string,
    accepted: boolean,
  ): Promise<{ success: boolean; message: string; booking?: Booking }> {
    // Check if driver is still pending for this booking (driverId is User ID from Redis)
    const isPending = await this.bookingStateService.isDriverPending(
      bookingId,
      driverId,
    );
    if (!isPending) {
      return {
        success: false,
        message: 'This booking is no longer available',
      };
    }

    if (accepted) {
      return this.handleAcceptance(bookingId, driverId);
    } else {
      return this.handleRejection(bookingId, driverId);
    }
  }

  /**
   * Handle driver accepting a booking
   * @param userId - User ID (from JWT/WebSocket, stored in Redis)
   */
  private async handleAcceptance(
    bookingId: string,
    userId: string,
  ): Promise<{ success: boolean; message: string; booking?: Booking }> {
    // Try to acquire lock (prevents race condition if multiple drivers accept)
    const lockAcquired = await this.bookingStateService.lockBooking(
      bookingId,
      userId,
    );

    if (!lockAcquired) {
      this.logger.warn(
        `User ${userId} lost race condition for booking ${bookingId}`,
      );
      return {
        success: false,
        message: 'Another driver already accepted this booking',
      };
    }

    try {
      // Look up driver entity by User ID to get Driver ID for database operations
      const driver = await this.driversRepository.findOne({
        where: { userId },
        relations: ['user'],
      });

      if (!driver) {
        throw new NotFoundException('Driver not found');
      }

      const driverId = driver.id;

      // Get booking
      const booking = await this.bookingsRepository.findOne({
        where: { id: bookingId },
        relations: ['customer'],
      });

      if (!booking) {
        throw new NotFoundException('Booking not found');
      }

      if (booking.status !== BookingStatus.PENDING) {
        return {
          success: false,
          message: 'Booking is no longer pending',
        };
      }

      // Validate driver's vehicle against cargo requirements
      let vehicleId: string;
      if (booking.cargoRequirements) {
        const validation =
          await this.logisticsService.validateDriverVehicleForBooking(
            driverId,
            booking.cargoRequirements,
          );

        if (!validation.result.canHandle) {
          throw new BadRequestException(
            `Your vehicle cannot handle this cargo: ${validation.result.reason}`,
          );
        }
        vehicleId = validation.vehicle.id;
      } else {
        const validation =
          await this.logisticsService.validateDriverVehicleForBooking(
            driverId,
            {} as CargoRequirements,
          );
        vehicleId = validation.vehicle.id;
      }

      // Assign booking to driver (using Driver entity ID for database)
      booking.driverId = driverId;
      booking.vehicleId = vehicleId;
      booking.status = BookingStatus.ACCEPTED;
      const savedBooking = await this.bookingsRepository.save(booking);

      // Update allocation status (using User ID for consistency with Redis state)
      await this.bookingStateService.setAllocationStatus(
        bookingId,
        BookingAllocationStatus.ACCEPTED,
        userId,
      );

      // Clear driver's pending request (using User ID)
      await this.bookingStateService.clearDriverPendingRequest(userId);

      // Notify customer
      try {
        await this.notificationsService.notifyCustomerBookingAccepted(
          booking.customerId,
          bookingId,
          driver?.user?.firstName || 'A driver',
        );
      } catch (error) {
        this.logger.warn('Failed to notify customer:', error);
      }

      // Notify other drivers that booking was taken
      // pendingDrivers contains User IDs from Redis
      const pendingUserIds =
        await this.bookingStateService.getPendingDrivers(bookingId);
      const otherUserIds = pendingUserIds.filter((id) => id !== userId);

      for (const otherUserId of otherUserIds) {
        await this.bookingStateService.clearDriverPendingRequest(otherUserId);

        // Send cancellation via WebSocket (using User ID for room)
        const server = this.bookingGateway.server;
        server.to(`driver_${otherUserId}`).emit('bookingCancelled', {
          bookingId,
          reason: 'Another driver accepted this booking',
        });

        // Send FCM notification (need to look up Driver ID for FCM token)
        // For now, we'll use userId - FCM service should handle User ID lookup
        await this.notificationsService.sendBookingCancelled(
          otherUserId,
          bookingId,
          'Another driver accepted this booking',
        );
      }

      // Remove booking-specific room
      this.bookingGateway.removeBookingRoom(bookingId);

      // Remove timeout job
      await this.bookingQueue.remove(`booking-timeout-${bookingId}`);

      // Clear booking state
      await this.bookingStateService.clearBookingState(bookingId);

      this.logger.log(
        `Booking ${bookingId} accepted by user ${userId} (driver ${driverId})`,
      );

      return {
        success: true,
        message: 'Booking accepted successfully',
        booking: savedBooking,
      };
    } catch (error) {
      await this.bookingStateService.unlockBooking(bookingId);
      throw error;
    }
  }

  /**
   * Handle driver rejecting a booking
   * @param userId - User ID (from JWT/WebSocket)
   */
  private async handleRejection(
    bookingId: string,
    userId: string,
  ): Promise<{ success: boolean; message: string }> {
    // Remove driver from pending list (using User ID)
    await this.bookingStateService.removeDriver(bookingId, userId);
    await this.bookingStateService.clearDriverPendingRequest(userId);

    // Check if any other drivers are still pending
    const remainingDrivers =
      await this.bookingStateService.getPendingDrivers(bookingId);

    this.logger.log(
      `User ${userId} rejected booking ${bookingId}. ${remainingDrivers.length} drivers remaining`,
    );

    // If no more drivers, trigger timeout early
    if (remainingDrivers.length === 0) {
      this.logger.warn(
        `No more drivers for booking ${bookingId}. Triggering timeout.`,
      );
      await this.handleTimeout(bookingId);
    }

    return {
      success: true,
      message: 'Booking rejected',
    };
  }

  /**
   * Handle booking timeout (no driver accepted within time limit)
   */
  async handleTimeout(bookingId: string): Promise<void> {
    const allocationStatus =
      await this.bookingStateService.getAllocationStatus(bookingId);

    // If already accepted, ignore timeout
    if (allocationStatus?.status === BookingAllocationStatus.ACCEPTED) {
      this.logger.log(
        `Booking ${bookingId} already accepted. Ignoring timeout.`,
      );
      return;
    }

    // Get booking
    const booking = await this.bookingsRepository.findOne({
      where: { id: bookingId },
    });

    if (!booking) {
      this.logger.warn(`Booking ${bookingId} not found for timeout`);
      return;
    }

    // Update booking status to cancelled
    booking.status = BookingStatus.CANCELLED;
    await this.bookingsRepository.save(booking);

    // Update allocation status
    await this.bookingStateService.setAllocationStatus(
      bookingId,
      BookingAllocationStatus.TIMEOUT,
    );

    // Notify customer
    try {
      await this.notificationsService.notifyCustomerBookingTimeout(
        booking.customerId,
        bookingId,
      );
    } catch (error) {
      this.logger.warn('Failed to notify customer of timeout:', error);
    }

    // Clear all pending drivers (pendingDrivers contains User IDs)
    const pendingUserIds =
      await this.bookingStateService.getPendingDrivers(bookingId);
    for (const userId of pendingUserIds) {
      await this.bookingStateService.clearDriverPendingRequest(userId);

      // Notify driver that booking expired (using User ID for room)
      const server = this.bookingGateway.server;
      server.to(`driver_${userId}`).emit('bookingCancelled', {
        bookingId,
        reason: 'Booking request expired',
      });
    }

    // Remove booking-specific room
    this.bookingGateway.removeBookingRoom(bookingId);

    // Clear booking state
    await this.bookingStateService.clearBookingState(bookingId);

    this.logger.log(`Booking ${bookingId} timed out - no driver accepted`);
  }
}
