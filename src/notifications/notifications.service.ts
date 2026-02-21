import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Driver } from '../drivers/entities/driver.entity';
import { User } from '../users/entities/user.entity';
import { Booking } from '../bookings/entities/booking.entity';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private firebaseApp: admin.app.App;

  constructor(
    private configService: ConfigService,
    @InjectRepository(Driver)
    private driversRepository: Repository<Driver>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {
    this.initializeFirebase();
  }

  private initializeFirebase() {
    try {
      const projectId = this.configService.get<string>('FIREBASE_PROJECT_ID');
      const clientEmail = this.configService.get<string>(
        'FIREBASE_CLIENT_EMAIL',
      );
      const privateKey = this.configService
        .get<string>('FIREBASE_PRIVATE_KEY')
        ?.replace(/\\n/g, '\n');

      if (!projectId || !clientEmail || !privateKey) {
        this.logger.warn(
          'Firebase credentials not configured. Push notifications will be disabled.',
        );
        return;
      }

      this.firebaseApp = admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });

      this.logger.log('Firebase Admin SDK initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Firebase Admin SDK:', error);
    }
  }

  /**
   * Send push notification to a specific device token
   */
  async sendToDevice(
    fcmToken: string,
    title: string,
    body: string,
    data?: Record<string, string>,
  ): Promise<boolean> {
    if (!this.firebaseApp) {
      this.logger.warn('Firebase not initialized. Skipping push notification.');
      return false;
    }

    try {
      const message: admin.messaging.Message = {
        token: fcmToken,
        notification: {
          title,
          body,
        },
        data: data || {},
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
            channelId: 'booking_requests',
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
            },
          },
        },
      };

      const response = await admin.messaging().send(message);
      this.logger.log(`Successfully sent notification: ${response}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send notification to ${fcmToken}:`, error);

      // If token is invalid, we could clear it from database
      if (
        error.code === 'messaging/invalid-registration-token' ||
        error.code === 'messaging/registration-token-not-registered'
      ) {
        this.logger.warn(
          `Invalid FCM token: ${fcmToken}. Consider clearing it from database.`,
        );
      }

      return false;
    }
  }

  /**
   * Send booking request notification to a driver
   */
  async sendBookingRequest(
    driverId: string,
    booking: Booking,
  ): Promise<boolean> {
    const driver = await this.driversRepository.findOne({
      where: { id: driverId },
    });

    if (!driver?.fcmToken) {
      this.logger.warn(`Driver ${driverId} has no FCM token registered`);
      return false;
    }

    // Extract location addresses
    const pickupAddress = booking.pickupLocation?.address || 'Unknown location';
    const dropoffAddress =
      booking.dropoffLocation?.address || 'Unknown location';

    // Calculate distance
    const distance = this.calculateDistance(
      booking.pickupLocation.lat,
      booking.pickupLocation.lng,
      booking.dropoffLocation.lat,
      booking.dropoffLocation.lng,
    );

    return this.sendToDevice(
      driver.fcmToken,
      'New Booking Request',
      `Pickup: ${pickupAddress} • ${distance.toFixed(1)}km • GH₵${booking.price}`,
      {
        type: 'booking_request',
        bookingId: booking.id,
        pickupLat: booking.pickupLocation.lat.toString(),
        pickupLng: booking.pickupLocation.lng.toString(),
        pickupAddress: pickupAddress,
        dropoffLat: booking.dropoffLocation.lat.toString(),
        dropoffLng: booking.dropoffLocation.lng.toString(),
        dropoffAddress: dropoffAddress,
        distance: distance.toFixed(1),
        price: booking.price.toString(),
        cargoType: booking.cargoRequirements.cargoType,
        cargoWeight: booking.cargoRequirements.weight.toString(),
      },
    );
  }

  /**
   * Send booking cancellation notification
   */
  async sendBookingCancelled(
    driverId: string,
    bookingId: string,
    reason: string,
  ): Promise<boolean> {
    const driver = await this.driversRepository.findOne({
      where: { id: driverId },
    });

    if (!driver?.fcmToken) {
      return false;
    }

    return this.sendToDevice(
      driver.fcmToken,
      'Booking Request Cancelled',
      reason,
      {
        type: 'booking_cancelled',
        bookingId,
      },
    );
  }

  /**
   * Notify customer that booking was accepted by a driver
   */
  async notifyCustomerBookingAccepted(
    userId: string,
    bookingId: string,
    driverName: string,
  ): Promise<boolean> {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
    });

    if (!user?.fcmToken) {
      return false;
    }

    return this.sendToDevice(
      user.fcmToken,
      'Booking Accepted',
      `${driverName} accepted your booking request`,
      {
        type: 'booking_accepted',
        bookingId,
      },
    );
  }

  /**
   * Notify customer that no driver accepted their booking
   */
  async notifyCustomerBookingTimeout(
    userId: string,
    bookingId: string,
  ): Promise<boolean> {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
    });

    if (!user?.fcmToken) {
      return false;
    }

    return this.sendToDevice(
      user.fcmToken,
      'No Driver Available',
      'Sorry, no driver accepted your booking. Please try again.',
      {
        type: 'booking_timeout',
        bookingId,
      },
    );
  }

  /**
   * Register/update FCM token for a driver
   */
  async registerDriverToken(driverId: string, fcmToken: string): Promise<void> {
    await this.driversRepository.update(driverId, { fcmToken });
    this.logger.log(`Updated FCM token for driver ${driverId}`);
  }

  /**
   * Register/update FCM token for a user
   */
  async registerUserToken(userId: string, fcmToken: string): Promise<void> {
    await this.usersRepository.update(userId, { fcmToken });
    this.logger.log(`Updated FCM token for user ${userId}`);
  }

  /**
   * Clear FCM token (e.g., on logout)
   */
  async clearDriverToken(driverId: string): Promise<void> {
    await this.driversRepository.update(driverId, { fcmToken: undefined });
  }

  /**
   * Clear user FCM token
   */
  async clearUserToken(userId: string): Promise<void> {
    await this.usersRepository.update(userId, { fcmToken: undefined });
  }

  /**
   * Calculate distance between two coordinates in kilometers using Haversine formula
   */
  private calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number,
  ): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Convert degrees to radians
   */
  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}
