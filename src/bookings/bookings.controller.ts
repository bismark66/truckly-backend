import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { BookingStatus } from './entities/booking.entity';

@ApiTags('Bookings')
@ApiBearerAuth()
@Controller('bookings')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Create new booking and find available drivers' })
  @ApiResponse({
    status: 201,
    description: 'Booking created and drivers notified',
  })
  @ApiResponse({ status: 400, description: 'No drivers available' })
  async create(@Request() req, @Body() createBookingDto: CreateBookingDto) {
    const customerId = req.user.userId;
    return this.bookingsService.create(customerId, createBookingDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get bookings for current user' })
  @ApiResponse({ status: 200, description: 'List of bookings' })
  async findAll(@Request() req) {
    if (req.user.role === UserRole.DRIVER) {
      return this.bookingsService.findAll();
    }
    return this.bookingsService.findAllByCustomerId(req.user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get booking by ID' })
  @ApiParam({ name: 'id', description: 'Booking ID' })
  @ApiResponse({ status: 200, description: 'Booking found' })
  async findOne(@Param('id') id: string) {
    return this.bookingsService.findOne(id);
  }

  @Patch(':id/accept')
  @Roles(UserRole.DRIVER)
  @ApiOperation({ summary: 'Accept booking (Driver only)' })
  @ApiParam({ name: 'id', description: 'Booking ID' })
  @ApiResponse({ status: 200, description: 'Booking accepted' })
  @ApiResponse({ status: 400, description: 'Booking cannot be accepted' })
  accept() {
    return {
      message: 'Driver acceptance logic requires DriversService integration',
      status: 'Feature in development',
    };
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update booking status' })
  @ApiParam({ name: 'id', description: 'Booking ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: [
            'PENDING',
            'ACCEPTED',
            'IN_PROGRESS',
            'COMPLETED',
            'CANCELLED',
          ],
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Status updated' })
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: BookingStatus,
  ) {
    return this.bookingsService.updateStatus(id, status);
  }

  @Get(':id/suggested-vehicles')
  @Roles(UserRole.CUSTOMER, UserRole.ADMIN, UserRole.DRIVER)
  @ApiOperation({
    summary: 'Get suggested vehicles for booking based on cargo requirements',
  })
  @ApiParam({ name: 'id', description: 'Booking ID' })
  @ApiResponse({
    status: 200,
    description: 'List of suggested vehicles ranked by match score',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          vehicle: { type: 'object' },
          matchScore: { type: 'number', example: 85 },
          canHandle: { type: 'boolean', example: true },
          reason: { type: 'string', example: 'Optimal capacity utilization' },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Booking does not have cargo requirements',
  })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  async getSuggestedVehicles(@Param('id') id: string) {
    return this.bookingsService.suggestVehicles(id);
  }
}
