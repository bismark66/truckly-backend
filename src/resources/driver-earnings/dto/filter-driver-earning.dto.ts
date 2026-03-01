import {
  IsOptional,
  IsEnum,
  IsString,
  IsDate,
  IsNumber,
  IsUUID,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { EarningType, EarningStatus } from '../entities/driver-earning.entity';

export class FilterDriverEarningDto {
  @IsOptional()
  @IsUUID()
  driverId?: string;

  @IsOptional()
  @IsUUID()
  tripId?: string;

  @IsOptional()
  @IsEnum(EarningType)
  type?: EarningType;

  @IsOptional()
  @IsEnum(EarningStatus)
  status?: EarningStatus;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  earningDateFrom?: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  earningDateTo?: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  payoutDateFrom?: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  payoutDateTo?: Date;

  @IsOptional()
  @IsString()
  payoutMethod?: string;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  limit?: number = 10;
}