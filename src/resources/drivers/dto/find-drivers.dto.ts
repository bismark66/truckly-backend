import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsLatitude, IsLongitude } from 'class-validator';

export class FindDriversDto {
  @ApiProperty({
    description: 'Latitude of the location to find drivers near',
    example: 37.7749,
  })
  @ApiProperty({
    description: 'Longitude of the location to find drivers near',
    example: -122.4194,
  })
  @IsNumber()
  @IsLatitude()
  lat: number;

  @ApiProperty({
    description: 'Longitude of the location to find drivers near',
    example: -122.4194,
  })
  @IsNumber()
  @IsLongitude()
  lng: number;
}
