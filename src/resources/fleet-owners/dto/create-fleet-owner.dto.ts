import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateFleetOwnerDto {
  @ApiProperty({
    example: 'Accra Transport Services Ltd',
    description: 'Company name',
  })
  @IsString()
  @IsNotEmpty()
  companyName: string;

  @ApiProperty({
    example: 'REG-2024-001234',
    description: 'Business registration number',
  })
  @IsString()
  @IsNotEmpty()
  registrationNumber: string;

  @ApiPropertyOptional({ example: '10', description: 'Number of vehicles in the fleet' })
  @IsString()
  @IsOptional()
  fleetSize?: string;

  @ApiPropertyOptional({
    example: ['Greater Accra', 'Ashanti'],
    description: 'Regions the fleet operates in',
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  operatingRegions?: string[];

  @ApiPropertyOptional({ example: '20+', description: 'Estimated monthly loads' })
  @IsString()
  @IsOptional()
  monthlyLoads?: string;
}
