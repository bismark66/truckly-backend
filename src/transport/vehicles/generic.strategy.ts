import {
  ITransport,
  CargoRequirements,
  CargoType,
  MatchResult,
} from '../factory';

/**
 * Generic transport strategy - fallback for vehicles with type "OTHER"
 * Characteristics: Generic capabilities, conservative matching
 */
export class GenericTransportStrategy implements ITransport {
  canHandleCargo(requirements: CargoRequirements): boolean {
    // Generic transport can handle most things except passengers and specialized requirements
    if (requirements.cargoType === CargoType.PASSENGERS) {
      return false;
    }
    if (
      requirements.requiresDump ||
      requirements.requiresFlatbed ||
      requirements.requiresPassengerSeats
    ) {
      return false;
    }

    // Only general and packaged goods
    return [CargoType.GENERAL, CargoType.PACKAGED].includes(
      requirements.cargoType,
    );
  }

  matchScore(
    requirements: CargoRequirements,
    vehicleCapacity: number,
  ): MatchResult {
    if (!this.canHandleCargo(requirements)) {
      return {
        canHandle: false,
        matchScore: 0,
        reason: 'Generic vehicle cannot handle specialized cargo requirements',
      };
    }

    // Check capacity
    if (requirements.weight > vehicleCapacity) {
      return {
        canHandle: false,
        matchScore: 0,
        reason: `Cargo weight (${requirements.weight}kg) exceeds vehicle capacity (${vehicleCapacity}kg)`,
      };
    }

    let score = 50; // Low base score - use specialized vehicles when available

    // Bonus for general freight
    if (requirements.cargoType === CargoType.GENERAL) {
      score += 15;
    }

    // Bonus for packaged goods
    if (requirements.cargoType === CargoType.PACKAGED) {
      score += 10;
    }

    // Capacity utilization bonus
    const utilization = requirements.weight / vehicleCapacity;
    if (utilization >= 0.7 && utilization <= 0.9) {
      score += 10;
    }

    return {
      canHandle: true,
      matchScore: Math.min(100, score),
    };
  }
}

export default GenericTransportStrategy;
