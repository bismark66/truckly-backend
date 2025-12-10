import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Inject, Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import { BaseGateway, RedisChannelHandler } from './base.gateway';
import { LocationGateway } from './location.gateway';
import { ChatGateway } from './chat.gateway';

/**
 * GatewayFactory - Central gateway that manages connection lifecycle
 * and routes Redis messages to appropriate handlers
 */
@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
})
@Injectable()
export class GatewayFactory
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private channelHandlers: Map<string, RedisChannelHandler['handler']> =
    new Map();

  constructor(
    @Inject('REDIS_SUBSCRIBER') private readonly redisSubscriber: Redis,
    private readonly locationGateway: LocationGateway,
    private readonly chatGateway: ChatGateway,
  ) {}

  /**
   * Called after WebSocket server is initialized
   * Registers all gateways and sets up Redis subscriptions
   */
  afterInit(server: Server) {
    // Register all gateways
    const gateways: BaseGateway[] = [this.locationGateway, this.chatGateway];

    // Collect all channel handlers
    const channels: string[] = [];
    for (const gateway of gateways) {
      gateway.setServer(server);
      for (const handler of gateway.getChannelHandlers()) {
        this.channelHandlers.set(handler.channel, handler.handler);
        channels.push(handler.channel);
      }
    }

    // Subscribe to all channels
    if (channels.length > 0) {
      this.redisSubscriber.subscribe(...channels);
      console.log(`Subscribed to Redis channels: ${channels.join(', ')}`);
    }

    // Route messages to appropriate handlers
    this.redisSubscriber.on('message', (channel, message) => {
      const handler = this.channelHandlers.get(channel);
      if (handler) {
        handler(message, this.server);
      }
    });

    console.log('Gateway Factory initialized');
  }

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }
}
