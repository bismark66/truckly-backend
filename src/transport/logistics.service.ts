import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vehicle, VehicleStatus } from '../vehicles/entities/vehicle.entity';
import { Driver } from '../drivers/entities/driver.entity';
import { RoadLogistics } from './logistics/roadLogistics';
import { CargoRequirements, MatchResult } from './factory';
import {
  canVehicleHandleCargoType,
  getCompatibleVehicleTypes,
} from './vehicle-cargo-compatibility';

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

  /**
   * Validate if a driver's vehicle can handle cargo requirements
   * Uses driver entity directly (not separate vehicle table)
   * @param driver - Driver entity with vehicle information
   * @param cargoRequirements - Cargo specifications
   * @returns Match result with validation details
   */
  validateDriverVehicle(
    driver: Driver,
    cargoRequirements: CargoRequirements,
  ): MatchResult {
    // Check if vehicle type can handle cargo type
    if (
      !canVehicleHandleCargoType(
        driver.vehicleType,
        cargoRequirements.cargoType,
      )
    ) {
      return {
        canHandle: false,
        matchScore: 0,
        reason: `${driver.vehicleType} cannot handle ${cargoRequirements.cargoType} cargo`,
      };
    }

    // Check capacity
    if (
      driver.vehicleCapacity &&
      cargoRequirements.weight > driver.vehicleCapacity
    ) {
      return {
        canHandle: false,
        matchScore: 0,
        reason: `Vehicle capacity (${driver.vehicleCapacity}kg) insufficient for cargo weight (${cargoRequirements.weight}kg)`,
      };
    }

    // Check volume
    if (
      cargoRequirements.volume &&
      driver.vehicleVolume &&
      cargoRequirements.volume > driver.vehicleVolume
    ) {
      return {
        canHandle: false,
        matchScore: 0,
        reason: `Vehicle volume (${driver.vehicleVolume}m³) insufficient for cargo volume (${cargoRequirements.volume}m³)`,
      };
    }

    // Check special requirements
    if (cargoRequirements.requiresFlatbed && !driver.hasFlatbed) {
      return {
        canHandle: false,
        matchScore: 0,
        reason: 'Flatbed required but vehicle does not have flatbed',
      };
    }

    if (cargoRequirements.requiresDump && !driver.hasDumpCapability) {
      return {
        canHandle: false,
        matchScore: 0,
        reason: 'Dump capability required but vehicle cannot dump',
      };
    }

    if (
      cargoRequirements.requiresPassengerSeats &&
      (!driver.passengerSeats || driver.passengerSeats < 1)
    ) {
      return {
        canHandle: false,
        matchScore: 0,
        reason: 'Passenger seats required but vehicle has none',
      };
    }

    // Calculate match score using transport strategy
    const strategy = this.roadLogistics.createTransport(driver.vehicleType);
    return strategy.matchScore(
      cargoRequirements,
      driver.vehicleCapacity || 5000,
    );
  }

  /**
   * Get compatible vehicle types for cargo requirements
   * @param cargoRequirements - Cargo specifications
   * @returns Array of compatible vehicle types
   */
  getCompatibleVehicleTypesForCargo(cargoRequirements: CargoRequirements) {
    return getCompatibleVehicleTypes(cargoRequirements.cargoType);
  }
}
