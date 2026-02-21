import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

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
}
