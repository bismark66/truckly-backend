import { Module, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { DriversModule } from '../drivers/drivers.module';
import { FleetOwnersModule } from '../fleet-owners/fleet-owners.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy';
import { UserSession } from './entities/user-session.entity';
import { DeviceInfoMiddleware } from '../../common/middlewares/deviceInfo.middleware';
import { CronModule } from '../../cron/cron.module';
import { FileUploadModule } from '../upload/file-upload.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserSession]),
    UsersModule,
    DriversModule,
    FleetOwnersModule,
    PassportModule,
    CronModule,
    FileUploadModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'secretKey',
        signOptions: { expiresIn: '60m' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(DeviceInfoMiddleware)
      .forRoutes({ path: 'auth/login', method: RequestMethod.POST });
  }
}
