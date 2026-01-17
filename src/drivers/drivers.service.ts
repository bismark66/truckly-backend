import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateDriverDto } from './dto/create-driver.dto';
import { UpdateDriverDto } from './dto/update-driver.dto';
import { Driver } from './entities/driver.entity';

@Injectable()
export class DriversService {
  constructor(
    @InjectRepository(Driver)
    private driversRepository: Repository<Driver>,
  ) {}

  async create(userId: string, createDriverDto: CreateDriverDto): Promise<Driver> {
    const existingDriver = await this.driversRepository.findOneBy({ userId });
    if (existingDriver) {
      throw new BadRequestException('Driver profile already exists');
    }

    const driver = this.driversRepository.create({
      ...createDriverDto,
      userId,
    });
    return this.driversRepository.save(driver);
  }

  findAll() {
    return this.driversRepository.find();
  }

  findOne(id: string) {
    return this.driversRepository.findOne({ where: { id }, relations: ['user'] });
  }

  findOneByUserId(userId: string) {
    return this.driversRepository.findOne({ where: { userId }, relations: ['user'] });
  }

  update(id: number, updateDriverDto: UpdateDriverDto) {
    return `This action updates a #${id} driver`;
  }

  remove(id: number) {
    return `This action removes a #${id} driver`;
  }

  /**
   * Update driver's last seen timestamp
   */
  async updateLastSeen(driverId: string): Promise<void> {
    await this.driversRepository.update(driverId, { lastSeenAt: new Date() });
  }

  /**
   * Update driver's location and last seen
   */
  async updateLocationAndLastSeen(
    driverId: string,
    lat: number,
    lng: number,
  ): Promise<void> {
    await this.driversRepository.update(driverId, {
      currentLatitude: lat,
      currentLongitude: lng,
      lastSeenAt: new Date(),
    });
  }
}

