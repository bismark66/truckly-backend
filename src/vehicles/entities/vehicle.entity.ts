import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { FleetOwner } from '../../fleet-owners/entities/fleet-owner.entity';
import { Driver, VehicleType } from '../../drivers/entities/driver.entity';

export { VehicleType } from '../../drivers/entities/driver.entity';

export enum VehicleStatus {
  AVAILABLE = 'AVAILABLE',
  IN_USE = 'IN_USE',
  MAINTENANCE = 'MAINTENANCE',
}

@Entity()
export class Vehicle {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => FleetOwner, (fleetOwner) => fleetOwner.vehicles)
  fleetOwner: FleetOwner;

  @Column()
  fleetOwnerId: string;

  @Column()
  licensePlate: string;

  @Column({
    type: 'enum',
    enum: VehicleType,
  })
  type: VehicleType;

  @Column({ type: 'float', nullable: true })
  capacity: number; // Legacy field - use vehicleCapacity instead

  // Vehicle capacity and capability fields for cargo matching
  @Column({ type: 'float', nullable: true })
  vehicleCapacity: number; // Capacity in kg

  @Column({ type: 'float', nullable: true })
  vehicleVolume: number; // Volume capacity in cubic meters

  @Column({ default: false })
  hasFlatbed: boolean; // Has flatbed configuration

  @Column({ default: false })
  hasDumpCapability: boolean; // Can dump cargo (tipper)

  @Column({ type: 'int', nullable: true })
  passengerSeats: number; // Number of passenger seats (for buses)

  @Column({
    type: 'enum',
    enum: VehicleStatus,
    default: VehicleStatus.AVAILABLE,
  })
  status: VehicleStatus;

  @OneToOne(() => Driver, { nullable: true })
  @JoinColumn()
  assignedDriver: Driver;

  @Column({ nullable: true })
  assignedDriverId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
