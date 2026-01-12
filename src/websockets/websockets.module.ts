import { Module } from '@nestjs/common';
import { LocationGateway } from './location.gateway';
import { ChatGateway } from './chat.gateway';
import { GatewayFactory } from './gateway.factory';
import { AudioCallGateway } from './audio';

@Module({
  providers: [LocationGateway, ChatGateway, GatewayFactory, AudioCallGateway],
  exports: [LocationGateway, ChatGateway, GatewayFactory, AudioCallGateway],
})
export class WebSocketsModule {}


