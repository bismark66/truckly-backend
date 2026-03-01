import { PartialType } from '@nestjs/mapped-types';
import { CreateDriverEarningDto } from './create-driver-earning.dto';
import { IsEnum, IsOptional, IsString, IsDate } from 'class-validator';
import { Type } from 'class-transformer';
import { EarningStatus } from '../entities/driver-earning.entity';

export class UpdateDriverEarningDto extends PartialType(CreateDriverEarningDto) {
  @IsOptional()
  @IsEnum(EarningStatus)
  status?: EarningStatus;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  payoutDate?: Date;

  @IsOptional()
  @IsString()
  payoutReference?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}