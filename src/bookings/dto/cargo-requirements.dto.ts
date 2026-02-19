import {
  IsNumber,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsString,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CargoType } from '../../transport/factory';

export { CargoType } from '../../transport/factory';

/**
 * DTO for cargo requirements used in booking and vehicle matching
 */
export class CargoRequirementsDto {
  @ApiProperty({
    description: 'Weight of cargo in kilograms',
    example: 5000,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  weight: number;

  @ApiPropertyOptional({
    description: 'Volume of cargo in cubic meters',
    example: 12.5,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  volume?: number;

  @ApiProperty({
    description: 'Type of cargo being transported',
    enum: CargoType,
    example: CargoType.PACKAGED,
  })
  @IsEnum(CargoType)
  cargoType: CargoType;

  @ApiPropertyOptional({
    description: 'Whether cargo requires open flatbed truck',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  requiresFlatbed?: boolean;

  @ApiPropertyOptional({
    description:
      'Whether cargo requires dumping capability (for loose materials)',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  requiresDump?: boolean;

  @ApiPropertyOptional({
    description: 'Whether transport requires passenger seating',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  requiresPassengerSeats?: boolean;

  @ApiPropertyOptional({
    description: 'Additional special requirements or notes',
    example: 'Fragile items, handle with care',
  })
  @IsOptional()
  @IsString()
  specialRequirements?: string;
}
