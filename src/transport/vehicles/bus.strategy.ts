import {
  ITransport,
  CargoRequirements,
  CargoType,
  MatchResult,
} from '../factory';

/**
 * Bus strategy - specialized for passenger transport
 * Characteristics: Passenger seating, not for cargo
 */
export class BusStrategy implements ITransport {
  canHandleCargo(requirements: CargoRequirements): boolean {
    // Bus is ONLY suitable for passenger transport
    return requirements.cargoType === CargoType.PASSENGERS;
  }

  matchScore(
    requirements: CargoRequirements,
    vehicleCapacity: number,
  ): MatchResult {
    if (!this.canHandleCargo(requirements)) {
      return {
        canHandle: false,
        matchScore: 0,
        reason: 'Bus is only suitable for passenger transport, not cargo',
      };
    }

    // For buses, capacity represents passenger seats
    // Weight represents number of passengers (assuming avg ~75kg per person)
    const estimatedPassengers = Math.ceil(requirements.weight / 75);

    if (estimatedPassengers > vehicleCapacity) {
      return {
        canHandle: false,
        matchScore: 0,
        reason: `Required passengers (${estimatedPassengers}) exceeds bus capacity (${vehicleCapacity} seats)`,
      };
    }

    let score = 90; // High base score for passenger transport

    // Bonus if passenger seats explicitly required
    if (requirements.requiresPassengerSeats) {
      score += 10;
    }

    // Seat utilization bonus (70-90% is ideal for profitable operations)
    const utilization = estimatedPassengers / vehicleCapacity;
    if (utilization >= 0.7 && utilization <= 0.9) {
      score += 5;
    }

    return {
      canHandle: true,
      matchScore: Math.min(100, score),
    };
  }
}

export default BusStrategy;
