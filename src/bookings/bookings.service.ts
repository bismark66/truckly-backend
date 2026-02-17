import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { Booking, BookingStatus } from './entities/booking.entity';
import { ChatService } from '../chat/chat.service';
import { LogisticsService, VehicleMatch } from '../transport/logistics.service';
import { VehiclesService } from '../vehicles/vehicles.service';
import { VehicleStatus } from '../vehicles/entities/vehicle.entity';
import { CargoRequirements } from '../transport/factory';

@Injectable()
export class BookingsService {
  constructor(
    @InjectRepository(Booking)
    private bookingsRepository: Repository<Booking>,
    private chatService: ChatService,
    private logisticsService: LogisticsService,
    private vehiclesService: VehiclesService,
  ) {}

  async create(
    customerId: string,
    createBookingDto: CreateBookingDto,
  ): Promise<Booking> {
    const booking = this.bookingsRepository.create({
      ...createBookingDto,
      customerId,
    });
    return this.bookingsRepository.save(booking);
  }

  findAll() {
    return this.bookingsRepository.find();
  }

  findAllByCustomerId(customerId: string) {
    return this.bookingsRepository.find({
      where: { customerId },
      relations: ['driver', 'vehicle'],
    });
  }

  findAllByDriverId(driverId: string) {
    return this.bookingsRepository.find({
      where: { driverId },
      relations: ['customer'],
    });
  }

  findOne(id: string) {
    return this.bookingsRepository.findOne({
      where: { id },
      relations: ['customer', 'driver', 'vehicle'],
    });
  }

  async acceptBooking(id: string, driverId: string) {
    const booking = await this.bookingsRepository.findOne({
      where: { id },
      relations: ['customer', 'vehicle'],
    });
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }
    if (booking.status !== BookingStatus.PENDING) {
      throw new BadRequestException('Booking is not pending');
    }

    // Validate driver's vehicle against cargo requirements if they exist
    if (booking.cargoRequirements) {
      try {
        const validation =
          await this.logisticsService.validateDriverVehicleForBooking(
            driverId,
            booking.cargoRequirements as CargoRequirements,
          );

        if (!validation.result.canHandle) {
          throw new BadRequestException(
            `Driver's vehicle cannot handle this cargo: ${validation.result.reason}`,
          );
        }

        // Assign validated vehicle to booking
        booking.vehicleId = validation.vehicle.id;

        // Update vehicle status to IN_USE
        await this.vehiclesService.updateStatus(
          validation.vehicle.id,
          VehicleStatus.IN_USE,
        );
      } catch (error) {
        // Re-throw if it's already a BadRequestException
        if (error instanceof BadRequestException) {
          throw error;
        }
        // For other errors, provide a generic message
        throw new BadRequestException(
          'Unable to validate driver vehicle for this booking',
        );
      }
    }

    booking.driverId = driverId;
    booking.status = BookingStatus.ACCEPTED;
    const savedBooking = await this.bookingsRepository.save(booking);

    // Create chat conversation for driver-customer communication
    const conversation = await this.chatService.createConversation(
      savedBooking.id,
      savedBooking.customerId,
      driverId,
    );

    return { booking: savedBooking, conversationId: conversation.id };
  }

  /**
   * Get suggested vehicles ranked by match score for a booking's cargo requirements
   * @param id - Booking ID
   * @param limit - Maximum number of suggestions (default 5)
   * @returns Array of vehicle matches sorted by score
   */
  async suggestVehicles(
    id: string,
    limit: number = 5,
  ): Promise<VehicleMatch[]> {
    const booking = await this.findOne(id);
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (!booking.cargoRequirements) {
      throw new BadRequestException(
        'Booking does not have cargo requirements specified',
      );
    }

    // Get suggestions from all available vehicles (not limited to a specific fleet)
    return this.logisticsService.suggestVehicles(
      null,
      booking.cargoRequirements as CargoRequirements,
      limit,
    );
  }

  async updateStatus(id: string, status: BookingStatus) {
    const booking = await this.findOne(id);
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    // Update vehicle status back to AVAILABLE when booking completes or is cancelled
    if (
      (status === BookingStatus.COMPLETED ||
        status === BookingStatus.CANCELLED) &&
      booking.vehicleId
    ) {
      try {
        await this.vehiclesService.updateStatus(
          booking.vehicleId,
          VehicleStatus.AVAILABLE,
        );
      } catch (error) {
        console.error('Error updating vehicle status:', error);
      }
    }

    booking.status = status;

    // End conversation when booking completes or is cancelled
    if (
      status === BookingStatus.COMPLETED ||
      status === BookingStatus.CANCELLED
    ) {
      try {
        const conversation =
          await this.chatService.getConversationByBookingId(id);
        if (conversation) {
          await this.chatService.endConversation(conversation.id);
        }
      } catch (error) {
        console.error('Error ending conversation:', error);
      }
    }

    return this.bookingsRepository.save(booking);
  }

  update(id: number, updateBookingDto: UpdateBookingDto) {
    return `This action updates a #${id} booking`;
  }

  remove(id: number) {
    return `This action removes a #${id} booking`;
  }
}
