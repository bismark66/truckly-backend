import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Inject, Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import { BaseGateway, RedisChannelHandler } from './base.gateway';
import { ConfigService } from '@nestjs/config';
import {
  DriverStatusService,
  DriverStatus,
} from '../drivers/driver-status.service';
import { DriversService } from '../drivers/drivers.service';

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
})
@Injectable()
export class LocationGateway extends BaseGateway {
  @WebSocketServer()
  declare public server: Server;

  constructor(
    @Inject('REDIS_CLIENT') redisPublisher: Redis,
    private configService: ConfigService,
    private driverStatusService: DriverStatusService,
    private driversService: DriversService,
  ) {
    super(redisPublisher);
  }

  getChannelHandlers(): RedisChannelHandler[] {
    return [
      {
        channel: 'driver-location',
        handler: (message: string, server: Server) => {
          const data = JSON.parse(message);
          console.log('Location update:', data);
          server.to(`tracking_${data.driverId}`).emit('driverLocation', data);
        },
      },
    ];
  }

  async findClosestDriver(
    lat: number,
    lng: number,
    radiusKm: number = this.configService.get('DRIVER_SEARCH_RADIUS') || 10,
  ) {
    console.log(
      `[LocationGateway] Searching for drivers: lat=${lat}, lng=${lng}, radius=${radiusKm}km`,
    );
    const driversNearMe: {
      driverId: string;
      distance: number;
      status: DriverStatus | null;
    }[] = [];

    const result = (await this.redisPublisher.call(
      'GEOSEARCH',
      'driver-locations',
      'FROMLONLAT',
      lng,
      lat,
      'BYRADIUS',
      radiusKm,
      'km',
      'WITHDIST',
      'ASC',
      'COUNT',
      10,
    )) as any;

    console.log(`[LocationGateway] GEOSEARCH returned:`, result);

    // GEOSEARCH returns array of tuples: [[driverId, distance], [driverId, distance], ...]
    const nearbyDrivers = Array.isArray(result) ? result : [];

    if (nearbyDrivers && nearbyDrivers.length > 0) {
      console.log(
        `[LocationGateway] Found ${nearbyDrivers.length} drivers in radius`,
      );
      for (const driver of nearbyDrivers) {
        const driverId = driver[0];
        const distance = driver[1];
        const status = await this.driverStatusService.getStatus(driverId);
        console.log(
          `[LocationGateway] Driver ${driverId} status: ${status}, distance: ${distance}km`,
        );
        // Only include online drivers
        if (status === DriverStatus.ONLINE) {
          driversNearMe.push({
            driverId,
            distance: parseFloat(distance),
            status,
          });
        }
      }
    } else {
      console.log(`[LocationGateway] No drivers found in GEOSEARCH`);
    }

    console.log(
      `[LocationGateway] Returning ${driversNearMe.length} online drivers:`,
      driversNearMe,
    );
    return driversNearMe.length > 0 ? driversNearMe.slice(0, 3) : null;
  }

  /**
   * Driver goes online
   */
  @SubscribeMessage('goOnline')
  async handleGoOnline(
    @MessageBody() data: { driverId: string },
    @ConnectedSocket() client: Socket,
  ) {
    await this.driverStatusService.setStatus(
      data.driverId,
      DriverStatus.ONLINE,
    );

    // Automatically join the driver's personal room for booking notifications
    client.join(`driver_${data.driverId}`);
    console.log(
      `[Status] Driver ${data.driverId} is now ONLINE and joined room driver_${data.driverId}`,
    );

    return { event: 'statusChanged', data: { status: DriverStatus.ONLINE } };
  }

  /**
   * Join driver's personal room to receive booking notifications
   * This should be called immediately after connection/authentication
   */
  @SubscribeMessage('joinDriverRoom')
  async handleJoinDriverRoom(
    @MessageBody() data: { driverId: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.join(`driver_${data.driverId}`);
    console.log(
      `[Room] Driver ${data.driverId} joined room driver_${data.driverId}`,
    );
    return {
      event: 'roomJoined',
      data: { room: `driver_${data.driverId}`, success: true },
    };
  }

  /**
   * Driver goes offline
   */
  @SubscribeMessage('goOffline')
  async handleGoOffline(
    @MessageBody() data: { driverId: string },
    @ConnectedSocket() client: Socket,
  ) {
    await this.driverStatusService.removeStatus(data.driverId);

    // Leave the driver's personal room when going offline
    client.leave(`driver_${data.driverId}`);
    console.log(
      `[Status] Driver ${data.driverId} is now OFFLINE and left room driver_${data.driverId}`,
    );

    return { event: 'statusChanged', data: { status: DriverStatus.OFFLINE } };
  }

  /**
   * Set driver status (ONLINE, OFFLINE, ON_TRIP)
   */
  @SubscribeMessage('setStatus')
  async handleSetStatus(
    @MessageBody() data: { driverId: string; status: DriverStatus },
    @ConnectedSocket() client: Socket,
  ) {
    if (data.status === DriverStatus.OFFLINE) {
      await this.driverStatusService.removeStatus(data.driverId);
    } else {
      await this.driverStatusService.setStatus(data.driverId, data.status);
    }
    console.log(
      `[Status] Driver ${data.driverId} status set to ${data.status}`,
    );
    return { event: 'statusChanged', data: { status: data.status } };
  }

  /**
   * Update driver location
   */
  @SubscribeMessage('updateLocation')
  async handleUpdateLocation(
    @MessageBody() data: { driverId: string; lat: number; lng: number },
    @ConnectedSocket() client: Socket,
  ) {
    // Store location in Redis geo set
    await this.redisPublisher.call(
      'GEOADD',
      'driver-locations',
      data.lng,
      data.lat,
      data.driverId,
    );

    // Update lastSeenAt in database
    await this.driversService.updateLocationAndLastSeen(
      data.driverId,
      data.lat,
      data.lng,
    );

    // Publish location update for tracking subscribers
    await this.redisPublisher.publish('driver-location', JSON.stringify(data));

    return { event: 'locationUpdated', data };
  }

  @SubscribeMessage('trackDriver')
  async handleTrackDriver(
    @MessageBody() data: { driverId: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.join(`tracking_${data.driverId}`);
    return { event: 'tracking', data: `Joined room tracking_${data.driverId}` };
  }

  @SubscribeMessage('findDrivers')
  async handleFindDrivers(
    @MessageBody() data: { lat: number; lng: number },
    @ConnectedSocket() client: Socket,
  ) {
    const closestDriver = await this.findClosestDriver(data.lat, data.lng);
    return { event: 'closestDriver', data: closestDriver };
  }

  /**
   * Get driver status
   */
  @SubscribeMessage('getDriverStatus')
  async handleGetDriverStatus(
    @MessageBody() data: { driverId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const status = await this.driverStatusService.getStatus(data.driverId);
    return {
      event: 'driverStatus',
      data: { driverId: data.driverId, status: status || DriverStatus.OFFLINE },
    };
  }
}
