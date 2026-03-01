import { PartialType } from '@nestjs/mapped-types';
import { CreateFleetOwnerDto } from './create-fleet-owner.dto';

export class UpdateFleetOwnerDto extends PartialType(CreateFleetOwnerDto) {}
