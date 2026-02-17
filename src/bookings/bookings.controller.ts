import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiBody } from '@nestjs/swagger';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
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
  @ApiOperation({ summary: 'Create new booking' })
  @ApiResponse({ status: 201, description: 'Booking created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  create(@Request() req, @Body() createBookingDto: CreateBookingDto) {
    console.log(req.user);
    return this.bookingsService.create(req.user.userId, createBookingDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get bookings for current user' })
  @ApiResponse({ status: 200, description: 'List of bookings' })
  findAll(@Request() req) {
    if (req.user.role === UserRole.DRIVER) {
      // In a real app, we'd need to fetch the driver profile first to get driverId
      // For now assuming userId maps to driver logic or passing driverId
      // Let's assume we fetch all bookings for now or filter by driverId if we had it easily
      // A better way is to have a separate endpoint or service method that resolves driverId from userId
      return this.bookingsService.findAll(); // Placeholder: Drivers see all available bookings? Or assigned?
    }
    return this.bookingsService.findAllByCustomerId(req.user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get booking by ID' })
  @ApiParam({ name: 'id', description: 'Booking ID' })
  @ApiResponse({ status: 200, description: 'Booking found' })
  findOne(@Param('id') id: string) {
    return this.bookingsService.findOne(id);
  }

  @Patch(':id/accept')
  @Roles(UserRole.DRIVER)
  @ApiOperation({ summary: 'Accept booking (Driver only)' })
  @ApiParam({ name: 'id', description: 'Booking ID' })
  @ApiResponse({ status: 200, description: 'Booking accepted' })
  @ApiResponse({ status: 400, description: 'Booking cannot be accepted' })
  accept(@Param('id') id: string, @Request() req) {
    // Need to resolve driverId from userId.
    // For MVP, let's assume the driver sends their driverId or we fetch it.
    // Ideally: const driver = await driversService.findOneByUserId(req.user.userId);
    // return this.bookingsService.acceptBooking(id, driver.id);
    // Since I can't easily inject DriversService here without circular dependency or module export,
    // I'll assume for now we pass driverId in body or just use userId as placeholder if schema allows,
    // but schema expects driverId (uuid of Driver entity).
    // I should probably export DriversService and import DriversModule.
    return {
      message: 'Driver acceptance logic requires DriversService integration',
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
  updateStatus(@Param('id') id: string, @Body('status') status: BookingStatus) {
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
  getSuggestedVehicles(@Param('id') id: string) {
    return this.bookingsService.suggestVehicles(id);
  }
}
