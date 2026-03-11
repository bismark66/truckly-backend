import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { VehicleType } from '../entities/driver.entity';

export class CreateDriverDto {
  @ApiProperty({
    example: 'GH-1234567-89',
    description: 'Driver license number',
  })
  @IsString()
  @IsNotEmpty()
  licenseNumber: string;

  @ApiProperty({
    example: 'TRAILER',
    enum: VehicleType,
    description: 'Type of vehicle the driver operates',
  })
  @IsEnum(VehicleType)
  @IsNotEmpty()
  vehicleType: VehicleType;

  @ApiPropertyOptional({
    example: 'REF-ABC123',
    description: 'Optional referral code',
  })
  @IsString()
  @IsOptional()
  referralCode?: string;
}
