import { Module } from '@nestjs/common';
import { LocationGateway } from './location.gateway';
import { ChatGateway } from './chat.gateway';
import { GatewayFactory } from './gateway.factory';
import { AudioCallGateway } from './audio';
import { DriversModule } from '../drivers/drivers.module';
import { ChatModule } from '../chat/chat.module';

@Module({
  imports: [DriversModule, ChatModule],
  providers: [LocationGateway, ChatGateway, GatewayFactory, AudioCallGateway],
  exports: [LocationGateway, ChatGateway, GatewayFactory, AudioCallGateway],
})
export class WebSocketsModule {}




