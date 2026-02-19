import {
  ITransport,
  CargoRequirements,
  CargoType,
  MatchResult,
} from '../factory';

/**
 * Flatbed truck strategy - ideal for construction materials, equipment, and large items
 * Characteristics: Open bed, no dumping, good for heavy loads that need top/side loading
 */
export class FlatbedStrategy implements ITransport {
  canHandleCargo(requirements: CargoRequirements): boolean {
    // Flatbed is NOT suitable for loose bulk materials (needs tipper) or passengers
    if (
      requirements.cargoType === CargoType.BULK &&
      requirements.requiresDump
    ) {
      return false;
    }
    if (requirements.cargoType === CargoType.PASSENGERS) {
      return false;
    }

    // Excellent for items specifically requiring flatbed
    if (requirements.requiresFlatbed) {
      return true;
    }

    // Good for packaged goods, general freight, and mining equipment
    return [CargoType.PACKAGED, CargoType.GENERAL, CargoType.MINING].includes(
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
          'Flatbed cannot transport loose bulk materials requiring dump or passengers',
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

    // Bonus for specific flatbed requirement
    if (requirements.requiresFlatbed) {
      score += 25;
    }

    // Bonus for packaged or general freight (flatbed specialty)
    if (
      [CargoType.PACKAGED, CargoType.GENERAL].includes(requirements.cargoType)
    ) {
      score += 10;
    }

    // Bonus for mining equipment (heavy duty use case)
    if (
      requirements.cargoType === CargoType.MINING &&
      !requirements.requiresDump
    ) {
      score += 15;
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

export default FlatbedStrategy;
