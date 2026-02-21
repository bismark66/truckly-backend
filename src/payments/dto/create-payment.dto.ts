import { IsNotEmpty, IsNumber, IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePaymentDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Booking ID to make payment for',
  })
  @IsUUID()
  @IsNotEmpty()
  bookingId: string;

  @ApiProperty({ example: 150.5, description: 'Payment amount in GHS' })
  @IsNumber()
  @IsNotEmpty()
  amount: number;
}
