import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { FindDriversDto } from '../drivers/dto/find-drivers.dto';
import { LocationGateway } from '../websockets/location.gateway';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService, private readonly locationGateway: LocationGateway) {}

  @Post('drivers-near-me')
  async findDriversNearMe(@Body() findDriversDto: FindDriversDto) {
    const result = await this.locationGateway.findClosestDriver(
      findDriversDto.lat,
      findDriversDto.lng,
    );

    return result;
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
