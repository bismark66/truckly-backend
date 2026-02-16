import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { FleetOwnersService } from './fleet-owners.service';
import { CreateFleetOwnerDto } from './dto/create-fleet-owner.dto';
import { UpdateFleetOwnerDto } from './dto/update-fleet-owner.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('Fleet Owners')
@ApiBearerAuth()
@Controller('fleet-owners')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FleetOwnersController {
  constructor(private readonly fleetOwnersService: FleetOwnersService) {}

  @Post()
  @Roles(UserRole.FLEET_OWNER)
  @ApiOperation({ summary: 'Create fleet owner profile' })
  @ApiResponse({ status: 201, description: 'Fleet owner created successfully' })
  @ApiResponse({ status: 400, description: 'Fleet owner already exists for this user' })
  create(@Request() req, @Body() createFleetOwnerDto: CreateFleetOwnerDto) {
    return this.fleetOwnersService.create(req.user.userId, createFleetOwnerDto);
  }

  @Get('profile')
  @Roles(UserRole.FLEET_OWNER)
  @ApiOperation({ summary: 'Get current fleet owner profile' })
  @ApiResponse({ status: 200, description: 'Fleet owner profile retrieved' })
  getProfile(@Request() req) {
    return this.fleetOwnersService.findOneByUserId(req.user.userId);
  }

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all fleet owners (Admin only)' })
  @ApiResponse({ status: 200, description: 'List of all fleet owners' })
  findAll() {
    return this.fleetOwnersService.findAll();
  }

  @Get(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get fleet owner by ID (Admin only)' })
  @ApiParam({ name: 'id', description: 'Fleet Owner ID' })
  @ApiResponse({ status: 200, description: 'Fleet owner found' })
  findOne(@Param('id') id: string) {
    return this.fleetOwnersService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateFleetOwnerDto: UpdateFleetOwnerDto) {
    return this.fleetOwnersService.update(+id, updateFleetOwnerDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.fleetOwnersService.remove(+id);
  }
}
