import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vehicle, VehicleStatus } from '../vehicles/entities/vehicle.entity';
import { RoadLogistics } from './logistics/roadLogistics';
import { CargoRequirements, MatchResult } from './factory';

/**
 * Match result with vehicle details
 */
export interface VehicleMatch {
  vehicle: Vehicle;
  matchScore: number;
  canHandle: boolean;
  reason?: string;
}

/**
 * LogisticsService - NestJS service integrating factory pattern with database
 * Provides intelligent vehicle-cargo matching for bookings
 */
@Injectable()
export class LogisticsService {
  private roadLogistics: RoadLogistics;

  constructor(
    @InjectRepository(Vehicle)
    private vehiclesRepository: Repository<Vehicle>,
  ) {
    this.roadLogistics = new RoadLogistics();
  }

  /**
   * Find optimal vehicle for cargo requirements from a fleet owner's available vehicles
   * @param fleetOwnerId - Fleet owner's ID to filter vehicles
   * @param cargoRequirements - Cargo specifications
   * @returns Best matching vehicle or null if none suitable
   */
  async findOptimalVehicle(
    fleetOwnerId: string,
    cargoRequirements: CargoRequirements,
  ): Promise<VehicleMatch | null> {
    // Query available vehicles for the fleet owner
    const availableVehicles = await this.vehiclesRepository.find({
      where: {
        fleetOwnerId,
        status: VehicleStatus.AVAILABLE,
      },
      relations: ['fleetOwner'],
    });

    if (availableVehicles.length === 0) {
      return null;
    }

    return this.findBestMatchFromVehicles(availableVehicles, cargoRequirements);
  }

  /**
   * Find optimal vehicle from any available vehicles (admin use case)
   * @param cargoRequirements - Cargo specifications
   * @returns Best matching vehicle or null if none suitable
   */
  async findOptimalVehicleGlobal(
    cargoRequirements: CargoRequirements,
  ): Promise<VehicleMatch | null> {
    const availableVehicles = await this.vehiclesRepository.find({
      where: {
        status: VehicleStatus.AVAILABLE,
      },
      relations: ['fleetOwner'],
    });

    if (availableVehicles.length === 0) {
      return null;
    }

    return this.findBestMatchFromVehicles(availableVehicles, cargoRequirements);
  }

  /**
   * Suggest multiple vehicles ranked by match score
   * @param fleetOwnerId - Fleet owner's ID (optional, if null returns all available)
   * @param cargoRequirements - Cargo specifications
   * @param limit - Maximum number of suggestions (default 5)
   * @returns Array of vehicle matches sorted by score (highest first)
   */
  async suggestVehicles(
    fleetOwnerId: string | null,
    cargoRequirements: CargoRequirements,
    limit: number = 5,
  ): Promise<VehicleMatch[]> {
    const whereClause: any = {
      status: VehicleStatus.AVAILABLE,
    };

    if (fleetOwnerId) {
      whereClause.fleetOwnerId = fleetOwnerId;
    }

    const availableVehicles = await this.vehiclesRepository.find({
      where: whereClause,
      relations: ['fleetOwner'],
    });

    if (availableVehicles.length === 0) {
      return [];
    }

    // Score all vehicles
    const matches = availableVehicles
      .map((vehicle) => {
        const strategy = this.roadLogistics.createTransport(vehicle.type);
        const result = strategy.matchScore(
          cargoRequirements,
          vehicle.capacity || 0,
        );

        return {
          vehicle,
          matchScore: result.matchScore,
          canHandle: result.canHandle,
          reason: result.reason,
        };
      })
      .filter((match) => match.canHandle) // Only keep vehicles that can handle the cargo
      .sort((a, b) => b.matchScore - a.matchScore) // Sort by score descending
      .slice(0, limit); // Limit results

    return matches;
  }

  /**
   * Validate if a specific vehicle can handle cargo requirements
   * @param vehicleId - Vehicle ID to check
   * @param cargoRequirements - Cargo specifications
   * @returns Match result with validation details
   */
  async validateVehicleForBooking(
    vehicleId: string,
    cargoRequirements: CargoRequirements,
  ): Promise<MatchResult> {
    const vehicle = await this.vehiclesRepository.findOne({
      where: { id: vehicleId },
    });

    if (!vehicle) {
      throw new NotFoundException(`Vehicle with ID ${vehicleId} not found`);
    }

    const strategy = this.roadLogistics.createTransport(vehicle.type);
    return strategy.matchScore(cargoRequirements, vehicle.capacity || 0);
  }

  /**
   * Validate if a driver's assigned vehicle can handle cargo
   * @param driverId - Driver ID to check their vehicle
   * @param cargoRequirements - Cargo specifications
   * @returns Match result with validation details
   */
  async validateDriverVehicleForBooking(
    driverId: string,
    cargoRequirements: CargoRequirements,
  ): Promise<{ vehicle: Vehicle; result: MatchResult }> {
    const vehicle = await this.vehiclesRepository.findOne({
      where: { assignedDriverId: driverId },
      relations: ['assignedDriver'],
    });

    if (!vehicle) {
      throw new BadRequestException(
        `Driver ${driverId} does not have an assigned vehicle`,
      );
    }

    const strategy = this.roadLogistics.createTransport(vehicle.type);
    const result = strategy.matchScore(
      cargoRequirements,
      vehicle.capacity || 0,
    );

    return { vehicle, result };
  }

  /**
   * Helper method to find best match from a list of vehicles
   */
  private findBestMatchFromVehicles(
    vehicles: Vehicle[],
    cargoRequirements: CargoRequirements,
  ): VehicleMatch | null {
    let bestMatch: VehicleMatch | null = null;

    for (const vehicle of vehicles) {
      const strategy = this.roadLogistics.createTransport(vehicle.type);
      const result = strategy.matchScore(
        cargoRequirements,
        vehicle.capacity || 0,
      );

      if (
        result.canHandle &&
        (!bestMatch || result.matchScore > bestMatch.matchScore)
      ) {
        bestMatch = {
          vehicle,
          matchScore: result.matchScore,
          canHandle: result.canHandle,
          reason: result.reason,
        };
      }
    }

    return bestMatch;
  }
}
