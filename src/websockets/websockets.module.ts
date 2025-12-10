import { Module } from '@nestjs/common';
import { LocationGateway } from './location.gateway';
import { ChatGateway } from './chat.gateway';
import { GatewayFactory } from './gateway.factory';

@Module({
  providers: [LocationGateway, ChatGateway, GatewayFactory],
  exports: [LocationGateway, ChatGateway, GatewayFactory],
})
export class WebSocketsModule {}
