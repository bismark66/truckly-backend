import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { BookingType } from '../entities/booking.entity';
import { CargoRequirementsDto } from './cargo-requirements.dto';

export class CreateBookingDto {
  @ApiProperty({
    example: { lat: 5.6037, lng: -0.187, address: 'Accra Central, Ghana' },
    description: 'Pickup location coordinates and address',
  })
  @IsObject()
  @IsNotEmpty()
  pickupLocation: { lat: number; lng: number; address: string };

  @ApiProperty({
    example: { lat: 5.556, lng: -0.1969, address: 'Tema Port, Ghana' },
    description: 'Dropoff location coordinates and address',
  })
  @IsObject()
  @IsNotEmpty()
  dropoffLocation: { lat: number; lng: number; address: string };

  @ApiProperty({
    example: 'IMMEDIATE',
    enum: BookingType,
    description: 'Type of booking',
    required: false,
  })
  @IsEnum(BookingType)
  @IsOptional()
  type?: BookingType;

  @ApiProperty({
    example: 150.5,
    description: 'Booking price in GHS',
    required: false,
  })
  @IsNumber()
  @IsOptional()
  price?: number;

  @ApiProperty({
    example: '2025-11-25T10:00:00Z',
    description: 'Scheduled pickup time (for SCHEDULED bookings)',
    required: false,
  })
  @IsString()
  @IsOptional()
  scheduledTime?: string;

  @ApiPropertyOptional({
    description: 'Cargo requirements for intelligent vehicle matching',
    type: CargoRequirementsDto,
    example: {
      weight: 5000,
      volume: 12.5,
      cargoType: 'PACKAGED',
      requiresFlatbed: false,
      requiresDump: false,
    },
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CargoRequirementsDto)
  cargoRequirements?: CargoRequirementsDto;
}
