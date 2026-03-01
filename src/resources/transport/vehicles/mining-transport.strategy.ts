import {
  ITransport,
  CargoRequirements,
  CargoType,
  MatchResult,
} from '../factory';

/**
 * Mining transport strategy - heavy-duty vehicles for mining operations
 * Characteristics: Extra heavy capacity, specialized for mining materials and equipment
 */
export class MiningTransportStrategy implements ITransport {
  canHandleCargo(requirements: CargoRequirements): boolean {
    // Mining transport is NOT suitable for passengers
    if (requirements.cargoType === CargoType.PASSENGERS) {
      return false;
    }

    // Excellent for mining materials and bulk goods
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
        reason: 'Mining transport cannot carry passengers',
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

    let score = 70; // Base score

    // Bonus for mining cargo (this is the specialty)
    if (requirements.cargoType === CargoType.MINING) {
      score += 30;
    }

    // Bonus for bulk materials (common in mining)
    if (requirements.cargoType === CargoType.BULK) {
      score += 20;
    }

    // Bonus if dump is required (many mining transports have dump capability)
    if (requirements.requiresDump) {
      score += 10;
    }

    // Bonus for heavy loads (mining transports are built for this)
    if (requirements.weight > 10000) {
      // Over 10 tons
      score += 15;
    }

    // Penalty for packaged goods (overkill for this vehicle type)
    if (requirements.cargoType === CargoType.PACKAGED) {
      score -= 20;
    }

    // Capacity utilization bonus (mining transports work best near full capacity)
    const utilization = requirements.weight / vehicleCapacity;
    if (utilization >= 0.85 && utilization <= 0.98) {
      score += 10;
    }

    return {
      canHandle: true,
      matchScore: Math.min(100, Math.max(0, score)),
    };
  }
}

export default MiningTransportStrategy;
