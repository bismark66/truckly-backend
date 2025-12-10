import { IsNumber, IsLatitude, IsLongitude } from 'class-validator';

export class FindDriversDto {
  @IsNumber()
  @IsLatitude()
  lat: number;

  @IsNumber()
  @IsLongitude()
  lng: number;
}
