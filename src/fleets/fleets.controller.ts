import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { FleetsService } from './fleets.service';
import { CreateFleetDto } from './dto/create-fleet.dto';
import { UpdateFleetDto } from './dto/update-fleet.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('Fleets')
@ApiBearerAuth()
@Controller('fleets')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FleetsController {
  constructor(private readonly fleetsService: FleetsService) {}

  @Post()
  @Roles(UserRole.FLEET_OWNER)
  @ApiOperation({ summary: 'Create fleet profile' })
  @ApiResponse({ status: 201, description: 'Fleet created successfully' })
  @ApiResponse({ status: 400, description: 'Fleet already exists for this user' })
  create(@Request() req, @Body() createFleetDto: CreateFleetDto) {
    return this.fleetsService.create(req.user.userId, createFleetDto);
  }

  @Get('profile')
  @Roles(UserRole.FLEET_OWNER)
  @ApiOperation({ summary: 'Get current fleet owner profile' })
  @ApiResponse({ status: 200, description: 'Fleet profile retrieved' })
  getProfile(@Request() req) {
    return this.fleetsService.findOneByUserId(req.user.userId);
  }

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all fleets (Admin only)' })
  @ApiResponse({ status: 200, description: 'List of all fleets' })
  findAll() {
    return this.fleetsService.findAll();
  }

  @Get(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get fleet by ID (Admin only)' })
  @ApiParam({ name: 'id', description: 'Fleet ID' })
  @ApiResponse({ status: 200, description: 'Fleet found' })
  findOne(@Param('id') id: string) {
    return this.fleetsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateFleetDto: UpdateFleetDto) {
    return this.fleetsService.update(+id, updateFleetDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.fleetsService.remove(+id);
  }
}
