import {
  ITransport,
  CargoRequirements,
  CargoType,
  MatchResult,
} from '../factory';

/**
 * Trailer strategy - versatile general freight transport
 * Characteristics: Enclosed trailer, good for packaged goods and general cargo
 */
export class TrailerStrategy implements ITransport {
  canHandleCargo(requirements: CargoRequirements): boolean {
    // Trailer is NOT suitable for passengers or materials specifically requiring dump
    if (requirements.cargoType === CargoType.PASSENGERS) {
      return false;
    }
    if (requirements.requiresDump) {
      return false;
    }

    // Good for most cargo types except passengers
    return true;
  }

  matchScore(
    requirements: CargoRequirements,
    vehicleCapacity: number,
  ): MatchResult {
    if (!this.canHandleCargo(requirements)) {
      return {
        canHandle: false,
        matchScore: 0,
        reason:
          'Trailer cannot transport passengers or materials requiring dumping capability',
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

    let score = 75; // Good base score - trailers are versatile

    // Bonus for packaged goods (trailer is ideal for this)
    if (requirements.cargoType === CargoType.PACKAGED) {
      score += 20;
    }

    // Bonus for general freight (trailer's main use case)
    if (requirements.cargoType === CargoType.GENERAL) {
      score += 15;
    }

    // Penalty if flatbed is specifically required (trailer is enclosed)
    if (requirements.requiresFlatbed) {
      score -= 25;
    }

    // Lower score for bulk materials (flatbed or tipper better)
    if (requirements.cargoType === CargoType.BULK) {
      score -= 15;
    }

    // Capacity utilization bonus (75-95% utilization is ideal)
    const utilization = requirements.weight / vehicleCapacity;
    if (utilization >= 0.75 && utilization <= 0.95) {
      score += 10;
    } else if (utilization < 0.4) {
      score -= 10; // Penalty for significant underutilization
    }

    return {
      canHandle: true,
      matchScore: Math.min(100, Math.max(0, score)),
    };
  }
}

export default TrailerStrategy;
