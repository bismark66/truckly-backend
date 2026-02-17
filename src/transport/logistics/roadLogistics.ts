import { ITransport, Logistics } from '../factory';
import { FlatbedStrategy } from '../vehicles/flatbed';
import { TipperStrategy } from '../vehicles/tipper';
import { BusStrategy } from '../vehicles/bus.strategy';
import { TrailerStrategy } from '../vehicles/trailer.strategy';
import { MiningTransportStrategy } from '../vehicles/mining-transport.strategy';
import { GenericTransportStrategy } from '../vehicles/generic.strategy';

/**
 * Road logistics factory - creates appropriate transport strategies for road vehicles
 * Maps VehicleType enum values to specific strategy implementations
 */
export class RoadLogistics extends Logistics {
  private strategyMap: Map<string, ITransport>;

  constructor() {
    super();
    // Initialize strategy instances (reusable, no state)
    this.strategyMap = new Map<string, ITransport>([
      ['TRAILER', new TrailerStrategy()],
      ['TIPPER_TRUCK', new TipperStrategy()],
      ['BUS', new BusStrategy()],
      ['MINING_TRANSPORT', new MiningTransportStrategy()],
      ['FLATBED', new FlatbedStrategy()], // Not in enum but keeping for flexibility
      ['OTHER', new GenericTransportStrategy()],
    ]);
  }

  /**
   * Create transport strategy for given vehicle type
   * @param vehicleType - VehicleType enum value (TRAILER, TIPPER_TRUCK, BUS, MINING_TRANSPORT, OTHER)
   * @returns Transport strategy instance for the vehicle type
   */
  createTransport(vehicleType: string): ITransport {
    const strategy = this.strategyMap.get(vehicleType);

    if (!strategy) {
      // Fallback to generic strategy for unknown types
      console.warn(
        `Unknown vehicle type: ${vehicleType}, using generic strategy`,
      );
      return new GenericTransportStrategy();
    }

    return strategy;
  }
}
