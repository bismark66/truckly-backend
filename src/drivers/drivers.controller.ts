import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { CacheInterceptor } from '@nestjs/cache-manager';
import { DriversService } from './drivers.service';
import { CreateDriverDto } from './dto/create-driver.dto';
import { UpdateDriverDto } from './dto/update-driver.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserType } from '../users/entities/user.entity';
import { NotificationsService } from '../notifications/notifications.service';

@ApiTags('Drivers')
@ApiBearerAuth()
@Controller('drivers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DriversController {
  constructor(
    private readonly driversService: DriversService,
    private readonly notificationsService: NotificationsService,
  ) {}

  @Post()
  @Roles(UserType.DRIVER)
  @ApiOperation({ summary: 'Create driver profile' })
  @ApiResponse({
    status: 201,
    description: 'Driver profile created successfully',
  })
  @ApiResponse({ status: 400, description: 'Driver profile already exists' })
  async create(@Request() req, @Body() createDriverDto: CreateDriverDto) {
    return this.driversService.create(req.user.userId, createDriverDto);
  }

  @Get('profile')
  @Roles(UserType.DRIVER)
  @ApiOperation({ summary: 'Get current driver profile' })
  @ApiResponse({ status: 200, description: 'Driver profile retrieved' })
  async getProfile(@Request() req) {
    return this.driversService.findOneByUserId(req.user.userId);
  }

  @Patch('me/fcm-token')
  @Roles(UserType.DRIVER)
  @ApiOperation({
    summary: 'Register or update FCM token for push notifications',
  })
  @ApiResponse({
    status: 200,
    description: 'FCM token registered successfully',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        fcmToken: {
          type: 'string',
          example: 'fcm_token_example_1234567890abcdefg',
        },
      },
      required: ['fcmToken'],
    },
  })
  async registerFcmToken(@Request() req, @Body('fcmToken') fcmToken: string) {
    return this.driversService.registerFcmToken(req.user.userId, fcmToken);
  }

  @Get()
  @Roles(UserType.ADMIN)
  @UseInterceptors(CacheInterceptor)
  @ApiOperation({ summary: 'Get all drivers (Admin only)' })
  @ApiResponse({ status: 200, description: 'List of all drivers' })
  findAll() {
    return this.driversService.findAll();
  }

  @Get(':id')
  @Roles(UserType.ADMIN)
  @ApiOperation({ summary: 'Get driver by ID (Admin only)' })
  @ApiParam({ name: 'id', description: 'Driver ID' })
  @ApiResponse({ status: 200, description: 'Driver found' })
  @ApiResponse({ status: 404, description: 'Driver not found' })
  findOne(@Param('id') id: string) {
    return this.driversService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDriverDto: UpdateDriverDto) {
    return this.driversService.update(+id, updateDriverDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.driversService.remove(+id);
  }
}
