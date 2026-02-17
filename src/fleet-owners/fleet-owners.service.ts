import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateFleetOwnerDto } from './dto/create-fleet-owner.dto';
import { UpdateFleetOwnerDto } from './dto/update-fleet-owner.dto';
import { FleetOwner } from './entities/fleet-owner.entity';
import { Logger } from '@nestjs/common';

@Injectable()
export class FleetOwnersService {
  private readonly logger = new Logger(FleetOwnersService.name);
  constructor(
    @InjectRepository(FleetOwner)
    private fleetOwnersRepository: Repository<FleetOwner>,
  ) {}

  async create(
    userId: string,
    createFleetOwnerDto: CreateFleetOwnerDto,
  ): Promise<FleetOwner> {
    try {
      const existingFleetOwner = await this.fleetOwnersRepository.findOneBy({
        userId,
      });
      if (existingFleetOwner) {
        throw new BadRequestException('Fleet owner profile already exists');
      }

      const fleetOwner = this.fleetOwnersRepository.create({
        ...createFleetOwnerDto,
        userId,
      });
      return this.fleetOwnersRepository.save(fleetOwner);
    } catch (error) {
      console.error('Error creating fleet owner:', error);
      this.logger.error(
        `Failed to create fleet owner for user ${userId}`,
        error,
      );
      throw new BadRequestException('Failed to create fleet owner profile');
    }
  }

  findAll() {
    return this.fleetOwnersRepository.find();
  }

  findOne(id: string) {
    try {
      return this.fleetOwnersRepository.findOne({
        where: { id },
        relations: ['vehicles'],
      });
    } catch (err) {
      this.logger.error('Error fetching fleet owner with id ' + id, err);
    }
  }

  findOneByUserId(userId: string) {
    return this.fleetOwnersRepository.findOne({
      where: { userId },
      relations: ['vehicles'],
    });
  }

  update(id: string, updateFleetOwnerDto: UpdateFleetOwnerDto) {
    return `This action updates a #${id} fleet owner`;
  }

  remove(id: string) {
    return `This action removes a #${id} fleet owner`;
  }
}
