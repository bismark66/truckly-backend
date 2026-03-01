/* eslint-disable @typescript-eslint/no-unsafe-argument */
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { DriverEarningsService } from './driver-earnings.service';
import { CreateDriverEarningDto } from './dto/create-driver-earning.dto';
import { UpdateDriverEarningDto } from './dto/update-driver-earning.dto';
import { FilterDriverEarningDto } from './dto/filter-driver-earning.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from 'src/resources/users/entities/user.entity';

@Controller('driver-earnings')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DriverEarningsController {
  constructor(private readonly driverEarningsService: DriverEarningsService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.FLEET_OWNER)
  create(@Body() createDriverEarningDto: CreateDriverEarningDto) {
    return this.driverEarningsService.create(createDriverEarningDto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.FLEET_OWNER)
  findAll(@Query() filter: FilterDriverEarningDto) {
    return this.driverEarningsService.findAll(filter);
  }

  @Get('driver/:driverId/summary')
  @Roles(UserRole.ADMIN, UserRole.FLEET_OWNER, UserRole.DRIVER)
  getDriverEarningsSummary(
    @Param('driverId') driverId: string,
    @Query('year') year?: number,
    @Query('month') month?: number,
  ) {
    return this.driverEarningsService.getDriverEarningsSummary(
      driverId,
      year,
      month,
    );
  }

  @Get('driver/:driverId/total')
  @Roles(UserRole.ADMIN, UserRole.FLEET_OWNER, UserRole.DRIVER)
  getDriverTotalEarnings(@Param('driverId') driverId: string) {
    return this.driverEarningsService.getDriverTotalEarnings(driverId);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.FLEET_OWNER, UserRole.DRIVER)
  findOne(@Param('id') id: string) {
    return this.driverEarningsService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.FLEET_OWNER)
  update(
    @Param('id') id: string,
    @Body() updateDriverEarningDto: UpdateDriverEarningDto,
  ) {
    return this.driverEarningsService.update(id, updateDriverEarningDto);
  }

  @Patch(':id/mark-paid')
  @Roles(UserRole.ADMIN, UserRole.FLEET_OWNER)
  markAsPaid(
    @Param('id') id: string,
    @Body() payload: { payoutReference: string; payoutMethod: string },
  ) {
    return this.driverEarningsService.markAsPaid(
      id,
      payload.payoutReference,
      payload.payoutMethod,
    );
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.driverEarningsService.remove(id);
  }
}
