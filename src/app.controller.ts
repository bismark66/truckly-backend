import { Controller, Get, Post, Body } from '@nestjs/common';
import { AppService } from './app.service';
import { LocationGateway } from './websockets/location.gateway';
import { FindDriversDto } from './drivers/dto/find-drivers.dto';
import {
  GatewayFactory,
  ConnectedClient,
} from './websockets/gateway.factory';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly locationGateway: LocationGateway,
    private readonly gatewayFactory: GatewayFactory,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Post('nearby-drivers')
  findDriversNearBy(@Body() findDriversDto: FindDriversDto): unknown {
    const results = this.locationGateway.findClosestDriver(
      findDriversDto.lat,
      findDriversDto.lng,
    );
    return results;
  }

  @Get('clients')
  async getConnectedClients(): Promise<ConnectedClient[]> {
    return this.gatewayFactory.getConnectedClients();
  }
}

