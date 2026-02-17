/* eslint-disable @typescript-eslint/require-await */
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
import { ChatService } from '../chat/chat.service';
import { SenderType } from '../chat/entities/message.entity';

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

  constructor(
    @Inject('REDIS_CLIENT') redisPublisher: Redis,
    private chatService: ChatService,
  ) {
    super(redisPublisher);
  }

  getChannelHandlers(): RedisChannelHandler[] {
    return [
      {
        channel: 'chat-messages',
        handler: (message: string, server: Server) => {
          const chatData = JSON.parse(message);
          server
            .to(`chat_${chatData.conversationId}`)
            .emit('newMessage', chatData);
        },
      },
    ];
  }

  /**
   * Join a chat room for a conversation
   */
  @SubscribeMessage('joinChat')
  async handleJoinChat(
    @MessageBody()
    data: {
      conversationId: string;
      userId: string;
      userType: 'driver' | 'customer';
    },
    @ConnectedSocket() client: Socket,
  ) {
    void client.join(`chat_${data.conversationId}`);
    client
      .to(`chat_${data.conversationId}`)
      .emit('userJoined', { userId: data.userId, userType: data.userType });
    return {
      event: 'joinedChat',
      data: { conversationId: data.conversationId },
    };
  }

  /**
   * Send a message - saves to DB and broadcasts
   */
  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @MessageBody()
    data: {
      conversationId: string;
      senderId: string;
      senderType: 'driver' | 'customer';
      content: string;
    },
    @ConnectedSocket() client: Socket,
  ) {
    if (!Object.values(SenderType).includes(data.senderType as SenderType)) {
      return { event: 'error', data: { message: 'Invalid sender type' } };
    }

    // Save message to database
    const message = await this.chatService.saveMessage(
      data.conversationId,
      data.senderId,
      data.senderType as SenderType,
      data.content,
    );

    const chatMessage = {
      id: message.id,
      conversationId: message.conversationId,
      senderId: message.senderId,
      senderType: message.senderType,
      content: message.content,
      status: message.status,
      sentAt: message.sentAt.toISOString(),
    };

    // Publish to Redis for multi-instance support
    await this.redisPublisher.publish(
      'chat-messages',
      JSON.stringify(chatMessage),
    );

    return { event: 'messageSent', data: chatMessage };
  }

  /**
   * Mark messages as delivered
   */
  @SubscribeMessage('markDelivered')
  async handleMarkDelivered(
    @MessageBody() data: { messageIds: string[]; conversationId: string },
    @ConnectedSocket() client: Socket,
  ) {
    await this.chatService.markAsDelivered(data.messageIds);

    // Notify sender that messages were delivered
    client.to(`chat_${data.conversationId}`).emit('messageDelivered', {
      messageIds: data.messageIds,
      deliveredAt: new Date().toISOString(),
    });

    return { event: 'deliveryConfirmed' };
  }

  /**
   * Mark messages as read
   */
  @SubscribeMessage('markRead')
  async handleMarkRead(
    @MessageBody() data: { messageIds: string[]; conversationId: string },
    @ConnectedSocket() client: Socket,
  ) {
    await this.chatService.markAsRead(data.messageIds);

    // Notify sender that messages were read
    client.to(`chat_${data.conversationId}`).emit('messagesRead', {
      messageIds: data.messageIds,
      readAt: new Date().toISOString(),
    });

    return { event: 'readConfirmed' };
  }

  /**
   * Sync messages after reconnection
   */
  @SubscribeMessage('syncMessages')
  async handleSyncMessages(
    @MessageBody()
    data: { conversationId: string; lastSyncTimestamp: string },
    @ConnectedSocket() client: Socket,
  ) {
    const since = new Date(data.lastSyncTimestamp);
    const messages = await this.chatService.getMessagesSince(
      data.conversationId,
      since,
    );

    return {
      event: 'syncedMessages',
      data: {
        messages: messages.map((m) => ({
          id: m.id,
          conversationId: m.conversationId,
          senderId: m.senderId,
          senderType: m.senderType,
          content: m.content,
          status: m.status,
          sentAt: m.sentAt.toISOString(),
          deliveredAt: m.deliveredAt?.toISOString(),
          readAt: m.readAt?.toISOString(),
        })),
        hasMore: false,
      },
    };
  }

  /**
   * Get conversation history
   */
  @SubscribeMessage('getMessages')
  async handleGetMessages(
    @MessageBody() data: { conversationId: string; limit?: number },
    @ConnectedSocket() client: Socket,
  ) {
    const messages = await this.chatService.getMessages(
      data.conversationId,
      data.limit || 50,
    );

    return {
      event: 'messageHistory',
      data: {
        messages: messages.reverse().map((m) => ({
          id: m.id,
          conversationId: m.conversationId,
          senderId: m.senderId,
          senderType: m.senderType,
          content: m.content,
          status: m.status,
          sentAt: m.sentAt.toISOString(),
          deliveredAt: m.deliveredAt?.toISOString(),
          readAt: m.readAt?.toISOString(),
        })),
      },
    };
  }

  /**
   * Leave chat room
   */
  @SubscribeMessage('leaveChat')
  handleLeaveChat(
    @MessageBody() data: { conversationId: string; userId: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.leave(`chat_${data.conversationId}`);
    client
      .to(`chat_${data.conversationId}`)
      .emit('userLeft', { userId: data.userId });
    return {
      event: 'leftChat',
      data: { conversationId: data.conversationId },
    };
  }
}
