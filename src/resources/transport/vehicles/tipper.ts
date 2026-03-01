import {
  ITransport,
  CargoRequirements,
  CargoType,
  MatchResult,
} from '../factory';

/**
 * Tipper truck strategy - ideal for loose bulk materials that need dumping
 * Characteristics: Hydraulic dumping bed, perfect for sand, gravel, mining materials
 */
export class TipperStrategy implements ITransport {
  canHandleCargo(requirements: CargoRequirements): boolean {
    // Tipper is NOT suitable for passengers
    if (requirements.cargoType === CargoType.PASSENGERS) {
      return false;
    }

    // Excellent for bulk materials requiring dump
    if (
      requirements.cargoType === CargoType.BULK ||
      requirements.requiresDump
    ) {
      return true;
    }

    // Can handle mining materials and general freight
    return [CargoType.MINING, CargoType.GENERAL].includes(
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
        reason:
          'Tipper truck cannot transport passengers or packaged goods requiring flatbed',
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

    let score = 70; // Base score for compatible cargo

    // Bonus for bulk materials (tipper specialty)
    if (requirements.cargoType === CargoType.BULK) {
      score += 25;
    }

    // Bonus for requiring dump capability
    if (requirements.requiresDump) {
      score += 20;
    }

    // Bonus for mining materials (common tipper use)
    if (requirements.cargoType === CargoType.MINING) {
      score += 15;
    }

    // Penalty if flatbed is specifically required (tipper has closed bed)
    if (requirements.requiresFlatbed) {
      score -= 30;
    }

    // Capacity utilization bonus (80-95% utilization is ideal)
    const utilization = requirements.weight / vehicleCapacity;
    if (utilization >= 0.8 && utilization <= 0.95) {
      score += 10;
    } else if (utilization < 0.5) {
      score -= 5; // Penalty for underutilization
    }

    return {
      canHandle: true,
      matchScore: Math.min(100, Math.max(0, score)),
    };
  }
}

export default TipperStrategy;
