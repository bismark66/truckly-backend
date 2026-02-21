import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LocationGateway } from './location.gateway';
import { ChatGateway } from './chat.gateway';
import { BookingGateway } from './booking.gateway';
import { GatewayFactory } from './gateway.factory';
import { AudioCallGateway } from './audio';
import { DriversModule } from '../drivers/drivers.module';
import { ChatModule } from '../chat/chat.module';
import { BookingsModule } from '../bookings/bookings.module';

@Module({
  imports: [
    DriversModule,
    ChatModule,
    forwardRef(() => BookingsModule),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'secretKey',
        signOptions: { expiresIn: '60m' }, // Match auth module expiration
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [
    LocationGateway,
    ChatGateway,
    BookingGateway,
    GatewayFactory,
    AudioCallGateway,
  ],
  exports: [
    LocationGateway,
    ChatGateway,
    BookingGateway,
    GatewayFactory,
    AudioCallGateway,
  ],
})
export class WebSocketsModule {}
