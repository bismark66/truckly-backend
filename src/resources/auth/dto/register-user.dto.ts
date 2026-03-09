import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  ValidateIf,
  IsArray,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserType } from '../../users/entities/user.entity';
import { VehicleType } from '../../drivers/entities/driver.entity';

export class RegisterUserDto {
  @ApiProperty({
    example: 'CUSTOMER',
    enum: UserType,
    description: 'User type - determines which additional fields are required',
  })
  @IsEnum(UserType)
  @IsNotEmpty()
  userType: UserType;

  @ApiProperty({ example: 'user@example.com', description: 'Email address' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'SecurePass123!', description: 'Password (min 6 characters)' })
  @IsString()
  @MinLength(6)
  @IsNotEmpty()
  password: string;

  @ApiProperty({ example: 'John', description: 'First name' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ example: 'Doe', description: 'Last name' })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({ example: '+233244123456', description: 'Phone number' })
  @IsString()
  @IsNotEmpty()
  phoneNumber: string;

  // Driver-specific fields
  @ApiPropertyOptional({ 
    example: 'GH-1234567-89', 
    description: 'Driver license number - Required for DRIVER userType' 
  })
  @ValidateIf(o => o.userType === UserType.DRIVER)
  @IsNotEmpty()
  @IsString()
  licenseNumber?: string;

  @ApiPropertyOptional({ 
    example: VehicleType.TRAILER, 
    enum: VehicleType,
    description: 'Vehicle type - Required for DRIVER userType' 
  })
  @ValidateIf(o => o.userType === UserType.DRIVER)
  @IsNotEmpty()
  @IsEnum(VehicleType)
  vehicleType?: VehicleType;

  @ApiPropertyOptional({ 
    example: 'REF-ABC123', 
    description: 'Referral code - Optional for DRIVER userType' 
  })
  @ValidateIf(o => o.userType === UserType.DRIVER)
  @IsOptional()
  @IsString()
  referralCode?: string;

  // Fleet Owner-specific fields
  @ApiPropertyOptional({ 
    example: 'Accra Haulage Ltd', 
    description: 'Company name - Required for FLEET_OWNER userType' 
  })
  @ValidateIf(o => o.userType === UserType.FLEET_OWNER)
  @IsNotEmpty()
  @IsString()
  companyName?: string;

  @ApiPropertyOptional({ 
    example: 'REG-2024-001', 
    description: 'Company registration number - Required for FLEET_OWNER userType' 
  })
  @ValidateIf(o => o.userType === UserType.FLEET_OWNER)
  @IsNotEmpty()
  @IsString()
  registrationNumber?: string;

  @ApiPropertyOptional({ 
    example: '10', 
    description: 'Fleet size - Optional for FLEET_OWNER userType' 
  })
  @ValidateIf(o => o.userType === UserType.FLEET_OWNER)
  @IsOptional()
  @IsString()
  fleetSize?: string;

  @ApiPropertyOptional({ 
    example: ['Greater Accra', 'Ashanti'], 
    description: 'Operating regions - Optional for FLEET_OWNER userType',
    type: [String]
  })
  @ValidateIf(o => o.userType === UserType.FLEET_OWNER)
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  operatingRegions?: string[];

  @ApiPropertyOptional({ 
    example: '20+', 
    description: 'Monthly loads capacity - Optional for FLEET_OWNER userType' 
  })
  @ValidateIf(o => o.userType === UserType.FLEET_OWNER)
  @IsOptional()
  @IsString()
  monthlyLoads?: string;
}