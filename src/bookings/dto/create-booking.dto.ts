import { IsEnum, IsNotEmpty, IsNumber, IsObject, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { BookingType } from '../entities/booking.entity';

export class CreateBookingDto {
  @ApiProperty({ 
    example: { lat: 5.6037, lng: -0.1870, address: 'Accra Central, Ghana' },
    description: 'Pickup location coordinates and address'
  })
  @IsObject()
  @IsNotEmpty()
  pickupLocation: { lat: number; lng: number; address: string };

  @ApiProperty({ 
    example: { lat: 5.5560, lng: -0.1969, address: 'Tema Port, Ghana' },
    description: 'Dropoff location coordinates and address'
  })
  @IsObject()
  @IsNotEmpty()
  dropoffLocation: { lat: number; lng: number; address: string };

  @ApiProperty({ 
    example: 'IMMEDIATE', 
    enum: BookingType,
    description: 'Type of booking',
    required: false
  })
  @IsEnum(BookingType)
  @IsOptional()
  type?: BookingType;

  @ApiProperty({ example: 150.50, description: 'Booking price in GHS', required: false })
  @IsNumber()
  @IsOptional()
  price?: number;

  @ApiProperty({ 
    example: '2025-11-25T10:00:00Z', 
    description: 'Scheduled pickup time (for SCHEDULED bookings)',
    required: false
  })
  @IsString()
  @IsOptional()
  scheduledTime?: string;


  @ApiProperty({ example: '1234567890', description: 'Driver ID', required: false })
  @IsString()
  @IsOptional()
  driverId?: string;

  @ApiProperty({ example: '1234567890', description: 'Customer ID', required: false })
  @IsString()
  @IsOptional()
  customerId?: string;
}
