import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { DriverEarning, EarningStatus } from './entities/driver-earning.entity';
import { CreateDriverEarningDto } from './dto/create-driver-earning.dto';
import { UpdateDriverEarningDto } from './dto/update-driver-earning.dto';
import { FilterDriverEarningDto } from './dto/filter-driver-earning.dto';

@Injectable()
export class DriverEarningsService {
  constructor(
    @InjectRepository(DriverEarning)
    private readonly driverEarningRepository: Repository<DriverEarning>,
  ) {}

  async create(createDriverEarningDto: CreateDriverEarningDto): Promise<DriverEarning> {
    const earning = this.driverEarningRepository.create(createDriverEarningDto);
    return await this.driverEarningRepository.save(earning);
  }

  async findAll(filter: FilterDriverEarningDto) {
    const { page = 1, limit = 10, ...filterOptions } = filter;
    const skip = (page - 1) * limit;

    const queryBuilder = this.driverEarningRepository
      .createQueryBuilder('earning')
      .leftJoinAndSelect('earning.driver', 'driver')
      .leftJoinAndSelect('driver.user', 'user');

    if (filterOptions.driverId) {
      queryBuilder.andWhere('earning.driverId = :driverId', {
        driverId: filterOptions.driverId,
      });
    }

    if (filterOptions.tripId) {
      queryBuilder.andWhere('earning.tripId = :tripId', {
        tripId: filterOptions.tripId,
      });
    }

    if (filterOptions.type) {
      queryBuilder.andWhere('earning.type = :type', { type: filterOptions.type });
    }

    if (filterOptions.status) {
      queryBuilder.andWhere('earning.status = :status', {
        status: filterOptions.status,
      });
    }

    if (filterOptions.earningDateFrom && filterOptions.earningDateTo) {
      queryBuilder.andWhere('earning.earningDate BETWEEN :from AND :to', {
        from: filterOptions.earningDateFrom,
        to: filterOptions.earningDateTo,
      });
    }

    if (filterOptions.payoutDateFrom && filterOptions.payoutDateTo) {
      queryBuilder.andWhere('earning.payoutDate BETWEEN :payoutFrom AND :payoutTo', {
        payoutFrom: filterOptions.payoutDateFrom,
        payoutTo: filterOptions.payoutDateTo,
      });
    }

    if (filterOptions.payoutMethod) {
      queryBuilder.andWhere('earning.payoutMethod = :payoutMethod', {
        payoutMethod: filterOptions.payoutMethod,
      });
    }

    const [earnings, total] = await queryBuilder
      .orderBy('earning.earningDate', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      data: earnings,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<DriverEarning> {
    const earning = await this.driverEarningRepository.findOne({
      where: { id },
      relations: ['driver', 'driver.user'],
    });

    if (!earning) {
      throw new NotFoundException(`Driver earning with ID ${id} not found`);
    }

    return earning;
  }

  async update(id: string, updateDriverEarningDto: UpdateDriverEarningDto): Promise<DriverEarning> {
    const earning = await this.findOne(id);
    
    Object.assign(earning, updateDriverEarningDto);
    
    return await this.driverEarningRepository.save(earning);
  }

  async remove(id: string): Promise<void> {
    const earning = await this.findOne(id);
    await this.driverEarningRepository.remove(earning);
  }

  async getDriverTotalEarnings(driverId: string): Promise<number> {
    const result = await this.driverEarningRepository
      .createQueryBuilder('earning')
      .select('SUM(earning.netAmount)', 'total')
      .where('earning.driverId = :driverId', { driverId })
      .andWhere('earning.status = :status', { status: EarningStatus.PAID })
      .getRawOne();

    return parseFloat(result.total) || 0;
  }

  async getDriverEarningsSummary(driverId: string, year?: number, month?: number) {
    const queryBuilder = this.driverEarningRepository
      .createQueryBuilder('earning')
      .where('earning.driverId = :driverId', { driverId });

    if (year) {
      queryBuilder.andWhere('EXTRACT(YEAR FROM earning.earningDate) = :year', { year });
    }

    if (month) {
      queryBuilder.andWhere('EXTRACT(MONTH FROM earning.earningDate) = :month', { month });
    }

    const [earnings, total] = await queryBuilder.getManyAndCount();

    const summary = earnings.reduce(
      (acc, earning) => {
        acc.totalGross += parseFloat(earning.grossAmount.toString());
        acc.totalNet += parseFloat(earning.netAmount.toString());
        acc.totalFees += parseFloat(earning.platformFee.toString());
        acc.totalTax += parseFloat(earning.tax.toString());
        acc.totalDeductions += parseFloat(earning.otherDeductions.toString());
        
        if (earning.status === EarningStatus.PAID) {
          acc.totalPaid += parseFloat(earning.netAmount.toString());
        }
        
        return acc;
      },
      {
        totalGross: 0,
        totalNet: 0,
        totalFees: 0,
        totalTax: 0,
        totalDeductions: 0,
        totalPaid: 0,
        totalEarnings: total,
      },
    );

    return summary;
  }

  async markAsPaid(id: string, payoutReference: string, payoutMethod: string): Promise<DriverEarning> {
    const earning = await this.findOne(id);
    
    earning.status = EarningStatus.PAID;
    earning.payoutDate = new Date();
    earning.payoutReference = payoutReference;
    earning.payoutMethod = payoutMethod;
    
    return await this.driverEarningRepository.save(earning);
  }
}