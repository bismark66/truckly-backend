/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
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

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
})
@Injectable()
export class ChatGateway extends BaseGateway {
  @WebSocketServer()
  declare protected server: Server;

  constructor(@Inject('REDIS_CLIENT') redisPublisher: Redis) {
    super(redisPublisher);
  }

  getChannelHandlers(): RedisChannelHandler[] {
    return [
      {
        channel: 'chat-messages',
        handler: (message: string, server: Server) => {
          const chatData = JSON.parse(message);
          server.to(`chat_${chatData.tripId}`).emit('newMessage', chatData);
        },
      },
    ];
  }

  @SubscribeMessage('joinChat')
  handleJoinChat(
    @MessageBody()
    data: { tripId: string; userId: string; userType: 'driver' | 'customer' },
    @ConnectedSocket() client: Socket,
  ) {
    client.join(`chat_${data.tripId}`);
    client
      .to(`chat_${data.tripId}`)
      .emit('userJoined', { userId: data.userId, userType: data.userType });
    return {
      event: 'joinedChat',
      data: `Joined chat room for trip ${data.tripId}`,
    };
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @MessageBody()
    data: {
      tripId: string;
      senderId: string;
      senderType: 'driver' | 'customer';
      message: string;
    },
    @ConnectedSocket() client: Socket,
  ) {
    console.log('---- cdjkd -----', data.message);
    const chatMessage = {
      ...data,
      timestamp: new Date().toISOString(),
    };
    await this.redisPublisher.publish(
      'chat-messages',
      JSON.stringify(chatMessage),
    );
    return { event: 'messageSent', data: chatMessage };
  }

  @SubscribeMessage('leaveChat')
  handleLeaveChat(
    @MessageBody() data: { tripId: string; userId: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.leave(`chat_${data.tripId}`);
    client.to(`chat_${data.tripId}`).emit('userLeft', { userId: data.userId });
    return {
      event: 'leftChat',
      data: `Left chat room for trip ${data.tripId}`,
    };
  }

  @SubscribeMessage('directMessage')
  handleDirectMessage(
    @MessageBody()
    data: {
      to: string;
      message: string;
    },
    @ConnectedSocket() client: Socket,
  ) {
    console.log('DM', data, 'from', client.id);
    const dmPayload = {
      senderId: client.id,
      message: data.message,
      timestamp: new Date().toISOString(),
    };

    // Send directly to the recipient's socket
    this.server.to(data.to).emit('newDirectMessage', dmPayload);

    return {
      event: 'directMessageSent',
      data: {
        to: data.to,
        message: data.message,
        timestamp: dmPayload.timestamp,
      },
    };
  }
}
