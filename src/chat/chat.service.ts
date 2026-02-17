import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, Not } from 'typeorm';
import { Conversation } from './entities/conversation.entity';
import { Message, MessageStatus, SenderType } from './entities/message.entity';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Conversation)
    private conversationRepo: Repository<Conversation>,
    @InjectRepository(Message)
    private messageRepo: Repository<Message>,
  ) {}

  /**
   * Create a conversation when a booking is accepted
   */
  async createConversation(
    bookingId: string,
    customerId: string,
    driverId: string,
  ): Promise<Conversation> {

    const isExisting = await this.conversationRepo.findOne({
      where: { bookingId },
    });
    if (isExisting) return isExisting;

    const conversation = this.conversationRepo.create({
      bookingId,
      customerId,
      driverId,
      isActive: true,
    });
    return this.conversationRepo.save(conversation);
  }

  /**
   * Get conversation by booking ID
   */
  async getConversationByBookingId(bookingId: string): Promise<Conversation | null> {
    return this.conversationRepo.findOne({ where: { bookingId } });
  }

  /**
   * Get conversation by ID
   */
  async getConversationById(id: string): Promise<Conversation | null> {
    return this.conversationRepo.findOne({ where: { id } });
  }

  /**
   * End conversation when trip completes
   */
  async endConversation(conversationId: string): Promise<void> {
    await this.conversationRepo.update(conversationId, { isActive: false });
  }

  /**
   * Save a new message
   */
  async saveMessage(
    conversationId: string,
    senderId: string,
    senderType: SenderType,
    content: string,
  ): Promise<Message> {
    const message = this.messageRepo.create({
      conversationId,
      senderId,
      senderType,
      content,
      status: MessageStatus.SENT,
    });
    return this.messageRepo.save(message);
  }

  /**
   * Get messages for a conversation
   */
  async getMessages(conversationId: string, limit = 50): Promise<Message[]> {
    return this.messageRepo.find({
      where: { conversationId },
      order: { sentAt: 'DESC' },
      take: limit,
    });
  }

  /**
   * Get messages after a specific timestamp (for sync)
   */
  async getMessagesSince(
    conversationId: string,
    since: Date,
  ): Promise<Message[]> {
    return this.messageRepo.find({
      where: {
        conversationId,
        sentAt: MoreThan(since),
      },
      order: { sentAt: 'ASC' },
    });
  }

  /**
   * Mark messages as delivered
   */
  async markAsDelivered(messageIds: string[]): Promise<void> {
    await this.messageRepo.update(messageIds, {
      status: MessageStatus.DELIVERED,
      deliveredAt: new Date(),
    });
  }

  /**
   * Mark messages as read
   */
  async markAsRead(messageIds: string[]): Promise<void> {
    await this.messageRepo.update(messageIds, {
      status: MessageStatus.READ,
      readAt: new Date(),
    });
  }

  /**
   * Get unread message count for a user in a conversation
   */
  async getUnreadCount(conversationId: string, userId: string): Promise<number> {
    return this.messageRepo.count({
      where: {
        conversationId,
        senderId: Not(userId),
        status: MessageStatus.SENT,
      },
    });
  }
}
