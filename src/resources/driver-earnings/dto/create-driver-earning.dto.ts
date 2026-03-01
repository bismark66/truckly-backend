import {
  IsEnum,
  IsString,
  IsNumber,
  IsOptional,
  IsDate,
  IsUUID,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { EarningType, EarningStatus } from '../entities/driver-earning.entity';

export class CreateDriverEarningDto {
  @IsUUID()
  driverId: string;

  @IsOptional()
  @IsUUID()
  tripId?: string;

  @IsEnum(EarningType)
  type: EarningType;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Transform(({ value }) => parseFloat(value))
  grossAmount: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Transform(({ value }) => parseFloat(value))
  platformFee?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Transform(({ value }) => parseFloat(value))
  tax?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Transform(({ value }) => parseFloat(value))
  otherDeductions?: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Transform(({ value }) => parseFloat(value))
  netAmount: number;

  @IsOptional()
  @IsEnum(EarningStatus)
  status?: EarningStatus;

  @IsDate()
  @Type(() => Date)
  earningDate: Date;

  @IsOptional()
  @IsString()
  payoutMethod?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}