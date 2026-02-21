import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { VehicleType, VehicleStatus } from '../entities/vehicle.entity';

export class CreateVehicleDto {
  @ApiProperty({
    example: 'GR-1234-20',
    description: 'Vehicle license plate number',
  })
  @IsString()
  @IsNotEmpty()
  licensePlate: string;

  @ApiProperty({
    example: 'TRAILER',
    enum: VehicleType,
    description: 'Type of vehicle',
  })
  @IsEnum(VehicleType)
  @IsNotEmpty()
  type: VehicleType;

  @ApiProperty({ example: 5000, description: 'Vehicle capacity in kg' })
  @IsNumber()
  @IsNotEmpty()
  capacity: number;

  @ApiProperty({
    example: 'AVAILABLE',
    enum: VehicleStatus,
    description: 'Current vehicle status',
    required: false,
  })
  @IsEnum(VehicleStatus)
  @IsOptional()
  status?: VehicleStatus;
}
