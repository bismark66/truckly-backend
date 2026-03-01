import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
import { BullModule } from '@nestjs/bull';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './resources/users/users.module';
import { AuthModule } from './resources/auth/auth.module';
import { DriversModule } from './resources/drivers/drivers.module';
import { FleetOwnersModule } from './resources/fleet-owners/fleet-owners.module';
import { DocumentsModule } from './resources/documents/documents.module';
import { BookingsModule } from './resources/bookings/bookings.module';
import { PaymentsModule } from './resources/payments/payments.module';
import { RedisModule } from './redis/redis.module';
import { WebSocketsModule } from './resources/websockets/websockets.module';
import { VehiclesModule } from './resources/vehicles/vehicles.module';
import { ChatModule } from './resources/chat/chat.module';
import { NotificationsModule } from './resources/notifications/notifications.module';
import { QueuesModule } from './resources/queues/queues.module';
import { CronModule } from './cron/cron.module';
import { DriverEarningsModule } from './resources/driver-earnings/driver-earnings.module';
import * as redisStore from 'cache-manager-redis-store';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const redisConfig: any = {
          store: redisStore,
          host: configService.get<string>('REDIS_HOST'),
          port: configService.get<number>('REDIS_PORT'),
          ttl: 600, // 10 minutes
        };

        // Add password if configured
        const redisPassword = configService.get<string>('REDIS_PASSWORD');
        if (redisPassword) {
          redisConfig.password = redisPassword;
        }

        return redisConfig;
      },
      inject: [ConfigService],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USER'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_NAME'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        migrations: [__dirname + '/database/migrations/*{.ts,.js}'],
        migrationsTableName: 'migrations',
        synchronize: false, // Use migrations for schema changes
        logging: configService.get<string>('NODE_ENV') === 'development',
      }),
      inject: [ConfigService],
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        redis: {
          host: configService.get<string>('REDIS_HOST'),
          port: configService.get<number>('REDIS_PORT'),
          password: configService.get<string>('REDIS_PASSWORD'),
        },
      }),
      inject: [ConfigService],
    }),
    ScheduleModule.forRoot(),
    UsersModule,
    AuthModule,
    DriversModule,
    DriverEarningsModule,
    FleetOwnersModule,
    VehiclesModule,
    DocumentsModule,
    BookingsModule,
    PaymentsModule,
    RedisModule,
    WebSocketsModule,
    ChatModule,
    NotificationsModule,
    QueuesModule,
    CronModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
