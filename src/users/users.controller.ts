import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { ParseFloatPipe } from '../common/pipes/parse-float.pipe';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { LocationGateway } from '../websockets/location.gateway';
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly locationGateway: LocationGateway,
  ) {}

  @Get('drivers-near-me/:lat/:lng')
  @ApiOperation({ summary: 'Find drivers near a given latitude and longitude' })
  @ApiParam({ name: 'lat', description: 'Latitude (float)', required: true })
  @ApiParam({ name: 'lng', description: 'Longitude (float)', required: true })
  @ApiResponse({ status: 200, description: 'List of nearby drivers' })
  async findDriversNearMe(
    @Param('lat', ParseFloatPipe) lat: number,
    @Param('lng', ParseFloatPipe) lng: number,
  ) {
    return this.locationGateway.findClosestDriver(lat, lng);
  }

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
