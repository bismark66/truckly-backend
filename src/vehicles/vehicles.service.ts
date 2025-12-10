import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { Vehicle } from './entities/vehicle.entity';
import { FleetsService } from '../fleets/fleets.service';

@Injectable()
export class VehiclesService {
  constructor(
    @InjectRepository(Vehicle)
    private vehiclesRepository: Repository<Vehicle>,
    private fleetsService: FleetsService,
  ) {}

  async create(userId: string, createVehicleDto: CreateVehicleDto): Promise<Vehicle> {
    const fleet = await this.fleetsService.findOneByUserId(userId);
    if (!fleet) {
      throw new NotFoundException('Fleet profile not found for user');
    }

    const vehicle = this.vehiclesRepository.create({
      ...createVehicleDto,
      fleetId: fleet.id,
    });
    return this.vehiclesRepository.save(vehicle);
  }

  findAll() {
    return this.vehiclesRepository.find();
  }

  async findAllByUserId(userId: string) {
    const fleet = await this.fleetsService.findOneByUserId(userId);
    if (!fleet) {
      return [];
    }
    return this.vehiclesRepository.find({ where: { fleetId: fleet.id } });
  }

  findOne(id: string) {
    return this.vehiclesRepository.findOne({ where: { id }, relations: ['fleet'] });
  }

  update(id: number, updateVehicleDto: UpdateVehicleDto) {
    return `This action updates a #${id} vehicle`;
  }

  remove(id: number) {
    return `This action removes a #${id} vehicle`;
  }
}
