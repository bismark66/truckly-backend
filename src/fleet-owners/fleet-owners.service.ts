import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateFleetOwnerDto } from './dto/create-fleet-owner.dto';
import { UpdateFleetOwnerDto } from './dto/update-fleet-owner.dto';
import { FleetOwner } from './entities/fleet-owner.entity';

@Injectable()
export class FleetOwnersService {
  constructor(
    @InjectRepository(FleetOwner)
    private fleetOwnersRepository: Repository<FleetOwner>,
  ) {}

  async create(userId: string, createFleetOwnerDto: CreateFleetOwnerDto): Promise<FleetOwner> {
    const existingFleetOwner = await this.fleetOwnersRepository.findOneBy({ userId });
    if (existingFleetOwner) {
      throw new BadRequestException('Fleet owner profile already exists');
    }

    const fleetOwner = this.fleetOwnersRepository.create({
      ...createFleetOwnerDto,
      userId,
    });
    return this.fleetOwnersRepository.save(fleetOwner);
  }

  findAll() {
    return this.fleetOwnersRepository.find();
  }

  findOne(id: string) {
    return this.fleetOwnersRepository.findOne({ where: { id }, relations: ['vehicles'] });
  }

  findOneByUserId(userId: string) {
    return this.fleetOwnersRepository.findOne({ where: { userId }, relations: ['vehicles'] });
  }

  update(id: number, updateFleetOwnerDto: UpdateFleetOwnerDto) {
    return `This action updates a #${id} fleet owner`;
  }

  remove(id: number) {
    return `This action removes a #${id} fleet owner`;
  }
}
