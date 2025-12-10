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

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
})
@Injectable()
export class LocationGateway extends BaseGateway {
  @WebSocketServer()
  declare protected server: Server;
 

  constructor(
    @Inject('REDIS_CLIENT') redisPublisher: Redis,
    private configService: ConfigService,
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


  async findClosestDriver(lat: number, lng: number, radiusKm: number = this.configService.get('DRIVER_SEARCH_RADIUS') || 10) {
  // Store driver location: GEOADD drivers <lng> <lat> <driverId>
  // Find nearby: GEORADIUS or GEOSEARCH
  const driversNearMe: { driverId: string; distance: number }[] = [];
  
  // GEOSEARCH with WITHDIST returns: [[driverId, distance], [driverId, distance], ...]
  const nearbyDrivers = await this.redisPublisher.call(
    'GEOSEARCH',
    'driver-locations',        // Key
    'FROMLONLAT', lng, lat,    // Customer location
    'BYRADIUS', radiusKm, 'km', // Search radius
    'WITHDIST',                 // Include distance
    'ASC',                      // Sort by closest first
    'COUNT', 3                  // Return top 3 closest
  ) as [string, string][] | null;  
  if (nearbyDrivers && nearbyDrivers.length > 0) {
    nearbyDrivers.forEach((driver) => {
      driversNearMe.push({
        driverId: driver[0],
        distance: parseFloat(driver[1]),
      });
    });
  }
  
  return driversNearMe.length > 0 ? driversNearMe : null;
}

  @SubscribeMessage('updateLocation')
  async handleUpdateLocation(
    @MessageBody() data: { driverId: string; lat: number; lng: number },
    @ConnectedSocket() client: Socket,
  ) {
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

}
