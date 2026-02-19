import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { VehiclesService } from './vehicles.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { LogisticsService } from '../transport/logistics.service';
import { CargoRequirementsDto } from '../bookings/dto/cargo-requirements.dto';

@ApiTags('Vehicles')
@ApiBearerAuth()
@Controller('vehicles')
@UseGuards(JwtAuthGuard, RolesGuard)
export class VehiclesController {
  constructor(
    private readonly vehiclesService: VehiclesService,
    private readonly logisticsService: LogisticsService,
  ) {}

  @Post()
  @Roles(UserRole.FLEET_OWNER)
  @ApiOperation({ summary: 'Add vehicle to fleet' })
  @ApiResponse({ status: 201, description: 'Vehicle added successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  create(@Request() req, @Body() createVehicleDto: CreateVehicleDto) {
    return this.vehiclesService.create(req.user.userId, createVehicleDto);
  }

  @Get()
  @Roles(UserRole.FLEET_OWNER)
  @ApiOperation({ summary: 'Get all vehicles in fleet' })
  @ApiResponse({ status: 200, description: 'List of vehicles' })
  findAll(@Request() req) {
    return this.vehiclesService.findAllByUserId(req.user.userId);
  }

  @Get(':id')
  @Roles(UserRole.FLEET_OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get vehicle by ID' })
  @ApiParam({ name: 'id', description: 'Vehicle ID' })
  @ApiResponse({ status: 200, description: 'Vehicle found' })
  findOne(@Param('id') id: string) {
    return this.vehiclesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateVehicleDto: UpdateVehicleDto) {
    return this.vehiclesService.update(+id, updateVehicleDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.vehiclesService.remove(+id);
  }

  @Post(':id/cargo-check')
  @Roles(UserRole.FLEET_OWNER, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Check if vehicle can handle specific cargo requirements',
  })
  @ApiParam({ name: 'id', description: 'Vehicle ID' })
  @ApiResponse({
    status: 200,
    description: 'Cargo compatibility check result',
    schema: {
      type: 'object',
      properties: {
        canHandle: { type: 'boolean', example: true },
        matchScore: { type: 'number', example: 85 },
        reason: { type: 'string', example: 'Vehicle capacity sufficient' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Vehicle not found' })
  async checkCargoCompatibility(
    @Param('id') id: string,
    @Body() cargoRequirements: CargoRequirementsDto,
  ) {
    return this.logisticsService.validateVehicleForBooking(
      id,
      cargoRequirements,
    );
  }
}
