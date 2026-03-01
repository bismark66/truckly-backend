import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Inject, Injectable, forwardRef, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import Redis from 'ioredis';
import { BaseGateway, RedisChannelHandler } from './base.gateway';
import { BookingAllocationService } from '../bookings/booking-allocation.service';
import { BookingStateService } from '../bookings/booking-state.service';

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  maxHttpBufferSize: 1e8,
  pingTimeout: 60000,
})
@Injectable()
export class BookingGateway
  extends BaseGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  declare public server: Server;

  private readonly logger = new Logger(BookingGateway.name);
  private driverSockets: Map<string, string> = new Map(); // driverId -> socketId

  constructor(
    @Inject('REDIS_CLIENT') redisPublisher: Redis,
    @Inject(forwardRef(() => BookingAllocationService))
    private bookingAllocationService: BookingAllocationService,
    private bookingStateService: BookingStateService,
    private jwtService: JwtService,
  ) {
    super(redisPublisher);
  }

  getChannelHandlers(): RedisChannelHandler[] {
    return [
      {
        channel: 'booking-events',
        handler: (message: string, server: Server) => {
          try {
            const data = JSON.parse(message);
            this.logger.log(`Broadcasting booking event: ${data.event}`);

            // Broadcast to specific user/driver based on event type
            if (data.customerId) {
              server
                .to(`customer_${data.customerId}`)
                .emit(data.event, data.payload);
            }
            if (data.driverId) {
              server
                .to(`driver_${data.driverId}`)
                .emit(data.event, data.payload);
            }
          } catch (error) {
            this.logger.error('Failed to parse booking event:', error);
          }
        },
      },
    ];
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);

    // Increase max listeners to prevent warnings from multiple gateway handlers
    client.setMaxListeners(20);

    // Extract JWT token from auth header
    const token = client.handshake.auth?.token as string | undefined;

    if (!token) {
      this.logger.warn(`Client ${client.id} connected without token`);
      return;
    }

    try {
      // Verify JWT token
      const payload = this.jwtService.verify(token) as {
        sub: string;
        userType: string;
      };
      const userId = payload.sub;
      const userType = payload.userType;

      this.logger.log(
        `Client ${client.id} authenticated as ${userType} ${userId}`,
      );

      // Auto-join personal room based on role (normalize to lowercase for consistency)
      const roomName = `${userType.toLowerCase()}_${userId}`;
      void client.join(roomName);
      this.logger.log(`Client ${client.id} auto-joined room ${roomName}`);

      // Track driver sockets for room management
      if (userType.toLowerCase() === 'driver') {
        this.driverSockets.set(userId, client.id);
        this.logger.log(`Tracking driver socket: ${userId} -> ${client.id}`);
      }

      // Store userId on socket for later use
      (client.data as any).userId = userId;
      (client.data as any).userType = userType;
    } catch (error) {
      this.logger.error(
        `JWT verification failed for client ${client.id}: ${(error as Error).message}`,
      );
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);

    // Clean up driver socket tracking
    const userId = (client.data as any).userId as string | undefined;
    const userType = (client.data as any).userType as string | undefined;

    if (userType?.toLowerCase() === 'driver' && userId) {
      this.driverSockets.delete(userId);
      this.logger.log(`Removed driver socket tracking: ${userId}`);

      // Auto-reject any pending booking requests when driver disconnects
      await this.handleDriverDisconnection(userId);
    }
  }

  /**
   * Handle cleanup when a driver disconnects
   * Auto-reject any pending booking requests
   */
  private async handleDriverDisconnection(userId: string): Promise<void> {
    try {
      // Check if driver has any pending booking request
      const pendingBookingId =
        await this.bookingStateService.getDriverPendingRequest(userId);

      if (!pendingBookingId) {
        this.logger.log(
          `Driver ${userId} disconnected with no pending bookings`,
        );
        return;
      }

      this.logger.warn(
        `Driver ${userId} disconnected with pending booking ${pendingBookingId}. Auto-rejecting...`,
      );

      // Remove driver from pending list
      await this.bookingStateService.removeDriver(pendingBookingId, userId);
      await this.bookingStateService.clearDriverPendingRequest(userId);

      // Check if any other drivers are still pending
      const remainingDrivers =
        await this.bookingStateService.getPendingDrivers(pendingBookingId);

      this.logger.log(
        `Booking ${pendingBookingId}: ${remainingDrivers.length} drivers remaining after disconnect`,
      );

      // If no more drivers, trigger timeout/cancellation immediately
      if (remainingDrivers.length === 0) {
        this.logger.warn(
          `No more drivers for booking ${pendingBookingId}. Triggering early timeout.`,
        );
        // Trigger timeout through allocation service
        await this.bookingAllocationService.handleTimeout(pendingBookingId);
      }
    } catch (error) {
      this.logger.error(
        `Error handling driver ${userId} disconnection: ${(error as Error).message}`,
      );
    }
  }

  /**
   * Driver or customer joins their personal room for receiving booking updates
   */
  @SubscribeMessage('joinRoom')
  handleJoinRoom(
    @MessageBody() data: { userId: string; userType: 'driver' | 'customer' },
    @ConnectedSocket() client: Socket,
  ) {
    // Normalize userType to lowercase for consistency with room naming
    const roomName = `${data.userType.toLowerCase()}_${data.userId}`;
    void client.join(roomName);
    this.logger.log(
      `User ${data.userId} (${data.userType}) joined room ${roomName}`,
    );
    return { event: 'roomJoined', data: { room: roomName } };
  }

  /**
   * Driver accepts a booking request
   * Note: driverId is the User ID (from JWT), not the Driver entity ID
   */
  @SubscribeMessage('acceptBooking')
  async handleAcceptBooking(
    @MessageBody() data: { bookingId: string; driverId: string },
  ) {
    this.logger.log(
      `User ${data.driverId} accepting booking ${data.bookingId}`,
    );

    try {
      const result = await this.bookingAllocationService.handleDriverResponse(
        data.bookingId,
        data.driverId,
        true, // accepted
      );

      if (result.success) {
        // Notify customer immediately via WebSocket
        if (result.booking) {
          this.server
            .to(`customer_${result.booking.customerId}`)
            .emit('bookingAccepted', {
              bookingId: data.bookingId,
              driverId: data.driverId,
              message: 'Your booking has been accepted!',
            });
        }
      }

      return {
        event: 'bookingAcceptanceResponse',
        data: result,
      };
    } catch (error) {
      this.logger.error(`Error accepting booking: ${(error as Error).message}`);
      return {
        event: 'bookingAcceptanceResponse',
        data: {
          success: false,
          message: (error as Error).message || 'Failed to accept booking',
        },
      };
    }
  }

  /**
   * Driver rejects a booking request
   * Note: driverId is the User ID (from JWT), not the Driver entity ID
   */
  @SubscribeMessage('rejectBooking')
  async handleRejectBooking(
    @MessageBody() data: { bookingId: string; driverId: string },
  ) {
    this.logger.log(
      `User ${data.driverId} rejecting booking ${data.bookingId}`,
    );

    try {
      const result = await this.bookingAllocationService.handleDriverResponse(
        data.bookingId,
        data.driverId,
        false, // rejected
      );

      return {
        event: 'bookingRejectionResponse',
        data: result,
      };
    } catch (error) {
      this.logger.error(`Error rejecting booking: ${(error as Error).message}`);
      return {
        event: 'bookingRejectionResponse',
        data: {
          success: false,
          message: (error as Error).message || 'Failed to reject booking',
        },
      };
    }
  }

  /**
   * Customer or driver requests booking status
   */
  @SubscribeMessage('getBookingStatus')
  handleGetBookingStatus(@MessageBody() data: { bookingId: string }) {
    // This would query the booking service for current status
    // Implementation depends on your needs
    return {
      event: 'bookingStatus',
      data: {
        bookingId: data.bookingId,
        message: 'Status check not yet implemented',
      },
    };
  }

  /**
   * Broadcast booking status change to relevant parties
   * Can be called from services
   */
  async broadcastBookingUpdate(
    bookingId: string,
    customerId: string,
    driverId: string | null,
    event: string,
    payload: any,
  ) {
    // Notify customer
    this.server
      .to(`customer_${customerId}`)
      .emit(event, { bookingId, ...payload });

    // Notify driver if assigned
    if (driverId) {
      this.server
        .to(`driver_${driverId}`)
        .emit(event, { bookingId, ...payload });
    }

    // Also publish to Redis for multi-instance sync
    await this.redisPublisher.publish(
      'booking-events',
      JSON.stringify({
        event,
        customerId,
        driverId,
        payload: { bookingId, ...payload },
      }),
    );
  }

  /**
   * Add a driver to a booking-specific room
   * Called when a driver is matched for a booking
   * @param driverId - User ID (not Driver entity ID) for WebSocket room tracking
   * @param bookingId - Booking ID
   */
  addDriverToBookingRoom(driverId: string, bookingId: string): void {
    const socketId = this.driverSockets.get(driverId);

    if (!socketId) {
      this.logger.warn(
        `Cannot add driver ${driverId} to booking room - not connected`,
      );
      return;
    }

    const socket = this.server.sockets.sockets.get(socketId);
    if (!socket) {
      this.logger.warn(
        `Cannot add driver ${driverId} to booking room - socket not found`,
      );
      return;
    }

    const roomName = `booking_${bookingId}`;
    void socket.join(roomName);
    this.logger.log(`Driver ${driverId} added to booking room ${roomName}`);
  }

  /**
   * Remove a booking-specific room (cleanup after booking is accepted/rejected/timeout)
   * Makes all clients leave the room
   */
  removeBookingRoom(bookingId: string): void {
    const roomName = `booking_${bookingId}`;

    // Make all sockets leave the room
    this.server.in(roomName).socketsLeave(roomName);

    this.logger.log(`Removed booking room ${roomName}`);
  }
}
