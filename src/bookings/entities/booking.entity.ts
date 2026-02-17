import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Driver } from '../../drivers/entities/driver.entity';
import { Vehicle } from '../../vehicles/entities/vehicle.entity';
import type { CargoRequirements } from '../../transport/factory';

export enum BookingStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum BookingType {
  IMMEDIATE = 'IMMEDIATE',
  SCHEDULED = 'SCHEDULED',
  LONG_TERM = 'LONG_TERM',
}

@Entity()
export class Booking {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  customer: User;

  @Column()
  customerId: string;

  @ManyToOne(() => Driver, { nullable: true })
  driver: Driver;

  @Column({ nullable: true })
  driverId: string;

  @ManyToOne(() => Vehicle, { nullable: true })
  vehicle: Vehicle;

  @Column({ nullable: true })
  vehicleId: string;

  @Column({ type: 'json' })
  pickupLocation: { lat: number; lng: number; address: string };

  @Column({ type: 'json' })
  dropoffLocation: { lat: number; lng: number; address: string };

  @Column({
    type: 'enum',
    enum: BookingStatus,
    default: BookingStatus.PENDING,
  })
  status: BookingStatus;

  @Column({
    type: 'enum',
    enum: BookingType,
    default: BookingType.IMMEDIATE,
  })
  type: BookingType;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  price: number;

  @Column({ nullable: true })
  scheduledTime: Date;

  @Column({ type: 'jsonb', nullable: true })
  cargoRequirements: CargoRequirements;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
