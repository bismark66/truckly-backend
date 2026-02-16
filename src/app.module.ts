import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { DriversModule } from './drivers/drivers.module';
import { FleetOwnersModule } from './fleet-owners/fleet-owners.module';
import { DocumentsModule } from './documents/documents.module';
import { BookingsModule } from './bookings/bookings.module';
import { PaymentsModule } from './payments/payments.module';
import { RedisModule } from './redis/redis.module';
import { WebSocketsModule } from './websockets/websockets.module';
import { VehiclesModule } from './vehicles/vehicles.module';
import { ChatModule } from './chat/chat.module';
import * as redisStore from 'cache-manager-redis-store';

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
    UsersModule,
    AuthModule,
    DriversModule,
    FleetOwnersModule,
    VehiclesModule,
    DocumentsModule,
    BookingsModule,
    PaymentsModule,
    RedisModule,
    WebSocketsModule,
    ChatModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
