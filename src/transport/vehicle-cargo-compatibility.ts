import { VehicleType } from '../drivers/entities/driver.entity';
import { CargoType } from './factory';

/**
 * Defines which vehicle types can handle which cargo types
 */
export const VEHICLE_CARGO_COMPATIBILITY: Record<VehicleType, CargoType[]> = {
  [VehicleType.TRAILER]: [
    CargoType.PACKAGED,
    CargoType.GENERAL,
    CargoType.BULK,
  ],
  [VehicleType.TIPPER_TRUCK]: [
    CargoType.BULK,
    CargoType.MINING,
    CargoType.PACKAGED,
  ],
  [VehicleType.BUS]: [CargoType.PASSENGERS],
  [VehicleType.MINING_TRANSPORT]: [CargoType.MINING, CargoType.BULK],
  [VehicleType.OTHER]: [CargoType.GENERAL, CargoType.PACKAGED],
};

/**
 * Check if a vehicle type can handle a specific cargo type
 */
export function canVehicleHandleCargoType(
  vehicleType: VehicleType,
  cargoType: CargoType,
): boolean {
  return VEHICLE_CARGO_COMPATIBILITY[vehicleType]?.includes(cargoType) ?? false;
}

/**
 * Get all compatible vehicle types for a cargo type
 */
export function getCompatibleVehicleTypes(cargoType: CargoType): VehicleType[] {
  return Object.entries(VEHICLE_CARGO_COMPATIBILITY)
    .filter(([, cargoTypes]) => cargoTypes.includes(cargoType))
    .map(([vehicleType]) => vehicleType as VehicleType);
}
