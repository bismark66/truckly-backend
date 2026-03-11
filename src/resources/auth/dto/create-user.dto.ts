import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsEnum,
  IsOptional,
  MinLength,
  IsArray,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserType } from '../../users/entities/user.entity';
import { VehicleType } from '../../drivers/entities/driver.entity';

export class BaseRegisterDto {
  @ApiProperty({
    description: 'User email',
    example: 'user@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'User password',
    example: 'password123',
  })
  @IsString()
  @MinLength(6)
  @IsNotEmpty()
  password: string;

  @ApiProperty({
    description: 'User type',
    enum: UserType,
    example: UserType.CUSTOMER,
  })
  @IsEnum(UserType)
  @IsNotEmpty()
  userType: UserType;

  @ApiProperty({
    description: 'User first name',
    example: 'John',
  })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({
    description: 'User last name',
    example: 'Doe',
  })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({
    description: 'User phone number',
    example: '+1234567890',
  })
  @IsString()
  @IsNotEmpty()
  phoneNumber: string;
}

export class DriverRegisterDto extends BaseRegisterDto {
  @ApiPropertyOptional({
    description: 'Set automatically — do not send',
    example: UserType.DRIVER,
    enum: [UserType.DRIVER],
  })
  @IsOptional()
  @IsEnum(UserType)
  userType: UserType.DRIVER;

  @ApiProperty({
    description: 'User license number',
    example: 'GH-1234567-89',
  })
  @IsString()
  @IsNotEmpty()
  licenseNumber: string;

  @ApiProperty({
    description: 'User vehicle type',
    example: 'TRAILER',
  })
  @IsEnum(VehicleType)
  @IsNotEmpty()
  vehicleType: VehicleType;

  @ApiProperty({
    description: 'User license front page url',
    example: 'https://example.com/license-front-page.jpg',
  })
  @IsString()
  @IsOptional()
  licenseFrontPageUrl: string;

  @ApiProperty({
    description: 'User license back page url',
    example: 'https://example.com/license-back-page.jpg',
  })
  @IsString()
  @IsOptional()
  licenseBackPageUrl: string;

  @ApiProperty({
    description: 'User referral code',
    example: 'REF-ABC123',
  })
  @IsString()
  @IsOptional()
  referralCode?: string;
}

export class CustomerRegisterDto extends BaseRegisterDto {
  @ApiPropertyOptional({
    description: 'Set automatically — do not send',
    example: UserType.CUSTOMER,
    enum: [UserType.CUSTOMER],
  })
  @IsOptional()
  @IsEnum(UserType)
  userType: UserType.CUSTOMER;
}

export class FleetOwnerRegisterDto extends BaseRegisterDto {
  @ApiProperty({
    description: 'User company name',
    example: 'Company Name',
  })
  @IsString()
  @IsNotEmpty()
  companyName: string;

  @ApiProperty({
    description: 'User registration number',
    example: 'REG-1234567-89',
  })
  @IsString()
  @IsNotEmpty()
  registrationNumber: string;

  @ApiProperty({
    description: 'User fleet size',
    example: '10',
  })
  @IsString()
  @IsOptional()
  fleetSize?: string;

  @ApiPropertyOptional({
    description: 'Fleet operating regions',
    example: ['Greater Accra', 'Ashanti'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  operatingRegions?: string[];

  @ApiPropertyOptional({
    description: 'Estimated monthly loads',
    example: '20+',
  })
  @IsString()
  @IsOptional()
  monthlyLoads?: string;

  @ApiProperty({
    description: 'User referral code',
    example: 'REF-ABC123',
  })
  @IsString()
  @IsOptional()
  referralCode?: string;

  @ApiPropertyOptional({
    description: 'Set automatically — do not send',
    example: UserType.FLEET_OWNER,
    enum: [UserType.FLEET_OWNER],
  })
  @IsOptional()
  @IsEnum(UserType)
  userType: UserType.FLEET_OWNER;
}
