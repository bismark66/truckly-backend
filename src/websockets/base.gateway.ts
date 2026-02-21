import { Server } from 'socket.io';
import Redis from 'ioredis';

/**
 * Interface for Redis message handlers
 */
export interface RedisChannelHandler {
  channel: string;
  handler: (message: string, server: Server) => void;
}

/**
 * Abstract base class for WebSocket gateways
 * Each gateway defines its own Redis channels and handlers
 */
export abstract class BaseGateway {
  protected server: Server;

  constructor(protected readonly redisPublisher: Redis) {}

  /**
   * Set the WebSocket server instance
   */
  setServer(server: Server): void {
    this.server = server;
  }

  /**
   * Get the Redis channels this gateway subscribes to
   */
  abstract getChannelHandlers(): RedisChannelHandler[];
}
