import { Controller, Get, Post, Body } from '@nestjs/common';
import { AppService } from './app.service';
import { LocationGateway } from './websockets/location.gateway';
import { FindDriversDto } from './drivers/dto/find-drivers.dto';
import { GatewayFactory } from './websockets/gateway.factory';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly locationGateway: LocationGateway,
    private readonly gatewayFactory: GatewayFactory,
  ) {}

  @Get()
  getHello() {
    return { message: this.appService.getHello() };
  }

  @Post('nearby-drivers')
  async findDriversNearBy(@Body() findDriversDto: FindDriversDto) {
    return this.locationGateway.findClosestDriver(
      findDriversDto.lat,
      findDriversDto.lng,
    );
  }

  @Get('clients')
  async getConnectedClients() {
    return this.gatewayFactory.getConnectedClients();
  }
}
