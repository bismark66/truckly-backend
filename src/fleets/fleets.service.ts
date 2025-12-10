import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateFleetDto } from './dto/create-fleet.dto';
import { UpdateFleetDto } from './dto/update-fleet.dto';
import { Fleet } from './entities/fleet.entity';

@Injectable()
export class FleetsService {
  constructor(
    @InjectRepository(Fleet)
    private fleetsRepository: Repository<Fleet>,
  ) {}

  async create(userId: string, createFleetDto: CreateFleetDto): Promise<Fleet> {
    const existingFleet = await this.fleetsRepository.findOneBy({ userId });
    if (existingFleet) {
      throw new BadRequestException('Fleet profile already exists');
    }

    const fleet = this.fleetsRepository.create({
      ...createFleetDto,
      userId,
    });
    return this.fleetsRepository.save(fleet);
  }

  findAll() {
    return this.fleetsRepository.find();
  }

  findOne(id: string) {
    return this.fleetsRepository.findOne({ where: { id }, relations: ['vehicles'] });
  }

  findOneByUserId(userId: string) {
    return this.fleetsRepository.findOne({ where: { userId }, relations: ['vehicles'] });
  }

  update(id: number, updateFleetDto: UpdateFleetDto) {
    return `This action updates a #${id} fleet`;
  }

  remove(id: number) {
    return `This action removes a #${id} fleet`;
  }
}
