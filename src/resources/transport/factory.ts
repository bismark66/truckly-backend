/**
 * Cargo type classification for transport matching
 */
export enum CargoType {
  BULK = 'BULK', // Loose materials (sand, gravel, etc.)
  PACKAGED = 'PACKAGED', // Palletized or containerized goods
  PASSENGERS = 'PASSENGERS', // People transport
  MINING = 'MINING', // Mining equipment and materials
  GENERAL = 'GENERAL', // General freight
}

/**
 * Requirements for cargo that need to be transported
 */
export interface CargoRequirements {
  weight: number; // Weight in kilograms
  volume?: number; // Volume in cubic meters (optional)
  cargoType: CargoType;
  requiresFlatbed?: boolean; // Needs open flatbed
  requiresDump?: boolean; // Needs dumping capability
  requiresPassengerSeats?: boolean; // Needs passenger seating
  specialRequirements?: string; // Additional notes
}

/**
 * Result of vehicle-cargo matching
 */
export interface MatchResult {
  canHandle: boolean;
  matchScore: number; // 0-100, higher is better match
  reason?: string; // Explanation if cannot handle
}

/**
 * Transport strategy interface for different vehicle types
 */
export interface ITransport {
  // Check if this transport type can handle the cargo requirements

  canHandleCargo(requirements: CargoRequirements): boolean;

  /**
   * Calculate match score (0-100) for cargo requirements
   * Higher score means better match
   */
  matchScore(
    requirements: CargoRequirements,
    vehicleCapacity: number,
  ): MatchResult;
}

/**
 * Factory interface for creating transport strategies
 */
export interface ITransportFactory {
  createTransport(vehicleType: string): ITransport;
}

/**
 * Base logistics class implementing factory pattern
 */
abstract class Logistics implements ITransportFactory {
  abstract createTransport(vehicleType: string): ITransport;

  /**
   * Find best matching transport for cargo requirements
   */
  findBestMatch(
    availableVehicles: Array<{ type: string; capacity: number }>,
    requirements: CargoRequirements,
  ): { vehicleIndex: number; result: MatchResult } | null {
    let bestMatch: { vehicleIndex: number; result: MatchResult } | null = null;

    availableVehicles.forEach((vehicle, index) => {
      const transport = this.createTransport(vehicle.type);
      const result = transport.matchScore(requirements, vehicle.capacity);

      if (
        result.canHandle &&
        (!bestMatch || result.matchScore > bestMatch.result.matchScore)
      ) {
        bestMatch = { vehicleIndex: index, result };
      }
    });

    return bestMatch;
  }
}

export { Logistics };
