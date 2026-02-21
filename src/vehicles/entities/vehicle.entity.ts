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
  capacity: number; // e.g., tons or seats

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
