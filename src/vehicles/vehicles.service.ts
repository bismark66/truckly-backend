import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { Vehicle, VehicleStatus } from './entities/vehicle.entity';
import { FleetOwnersService } from '../fleet-owners/fleet-owners.service';

@Injectable()
export class VehiclesService {
  constructor(
    @InjectRepository(Vehicle)
    private vehiclesRepository: Repository<Vehicle>,
    private fleetOwnersService: FleetOwnersService,
  ) {}

  async create(
    userId: string,
    createVehicleDto: CreateVehicleDto,
  ): Promise<Vehicle> {
    const fleetOwner = await this.fleetOwnersService.findOneByUserId(userId);
    if (!fleetOwner) {
      throw new NotFoundException('Fleet owner profile not found for user');
    }

    const vehicle = this.vehiclesRepository.create({
      ...createVehicleDto,
      fleetOwnerId: fleetOwner.id,
    });
    return this.vehiclesRepository.save(vehicle);
  }

  findAll() {
    return this.vehiclesRepository.find();
  }

  async findAllByUserId(userId: string): Promise<Vehicle[]> {
    const fleetOwner = await this.fleetOwnersService.findOneByUserId(userId);
    if (!fleetOwner) {
      return [];
    }
    return this.vehiclesRepository.find({
      where: { fleetOwnerId: fleetOwner.id },
    });
  }

  async findAvailableVehicles(fleetOwnerId: string): Promise<Vehicle[]> {
    return this.vehiclesRepository.find({
      where: {
        fleetOwnerId,
        status: VehicleStatus.AVAILABLE,
      },
    });
  }

  findOne(id: string) {
    return this.vehiclesRepository.findOne({
      where: { id },
      relations: ['fleetOwner'],
    });
  }

  async updateStatus(id: string, status: VehicleStatus): Promise<Vehicle> {
    const vehicle = await this.findOne(id);
    if (!vehicle) {
      throw new NotFoundException(`Vehicle with ID ${id} not found`);
    }
    vehicle.status = status;
    return this.vehiclesRepository.save(vehicle);
  }

  update(id: number, updateVehicleDto: UpdateVehicleDto) {
    return `This action updates a #${id} vehicle`;
  }

  remove(id: number) {
    return `This action removes a #${id} vehicle`;
  }
}
