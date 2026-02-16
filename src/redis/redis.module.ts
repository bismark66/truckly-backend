import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: 'REDIS_CLIENT',
      useFactory: (configService: ConfigService) => {
        const redisConfig: any = {
          host: configService.get<string>('REDIS_HOST'),
          port: configService.get<number>('REDIS_PORT'),
        };
        
        const redisPassword = configService.get<string>('REDIS_PASSWORD');
        if (redisPassword) {
          redisConfig.password = redisPassword;
        }
        
        return new Redis(redisConfig);
      },
      inject: [ConfigService],
    },
    {
      provide: 'REDIS_SUBSCRIBER',
      useFactory: (configService: ConfigService) => {
        const redisConfig: any = {
          host: configService.get<string>('REDIS_HOST'),
          port: configService.get<number>('REDIS_PORT'),
        };
        
        const redisPassword = configService.get<string>('REDIS_PASSWORD');
        if (redisPassword) {
          redisConfig.password = redisPassword;
        }
        
        return new Redis(redisConfig);
      },
      inject: [ConfigService],
    },
  ],
  exports: ['REDIS_CLIENT', 'REDIS_SUBSCRIBER'],
})
export class RedisModule {}
