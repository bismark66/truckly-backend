import { Controller, Get, Post, Body } from '@nestjs/common';
import { AppService } from './app.service';
import { LocationGateway } from './websockets/location.gateway';
import { FindDriversDto } from './drivers/dto/find-drivers.dto';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly locationGateway: LocationGateway,
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
}
