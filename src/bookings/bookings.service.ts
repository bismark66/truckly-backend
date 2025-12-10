import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { Booking, BookingStatus } from './entities/booking.entity';

@Injectable()
export class BookingsService {
  constructor(
    @InjectRepository(Booking)
    private bookingsRepository: Repository<Booking>,
  ) {}

  async create(customerId: string, createBookingDto: CreateBookingDto): Promise<Booking> {
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
    return this.bookingsRepository.find({ where: { customerId }, relations: ['driver', 'vehicle'] });
  }

  findAllByDriverId(driverId: string) {
    return this.bookingsRepository.find({ where: { driverId }, relations: ['customer'] });
  }

  findOne(id: string) {
    return this.bookingsRepository.findOne({ where: { id }, relations: ['customer', 'driver', 'vehicle'] });
  }

  async acceptBooking(id: string, driverId: string) {
    const booking = await this.findOne(id);
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }
    if (booking.status !== BookingStatus.PENDING) {
      throw new BadRequestException('Booking is not pending');
    }
    booking.driverId = driverId;
    booking.status = BookingStatus.ACCEPTED;
    return this.bookingsRepository.save(booking);
  }

  async updateStatus(id: string, status: BookingStatus) {
    const booking = await this.findOne(id);
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }
    booking.status = status;
    return this.bookingsRepository.save(booking);
  }

  update(id: number, updateBookingDto: UpdateBookingDto) {
    return `This action updates a #${id} booking`;
  }

  remove(id: number) {
    return `This action removes a #${id} booking`;
  }
}
