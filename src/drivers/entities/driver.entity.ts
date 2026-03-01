import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { DriverEarning } from '../../resources/driver-earnings/entities/driver-earning.entity';

export enum VehicleType {
  TRAILER = 'TRAILER',
  TIPPER_TRUCK = 'TIPPER_TRUCK',
  BUS = 'BUS',
  MINING_TRANSPORT = 'MINING_TRANSPORT',
  OTHER = 'OTHER',
}

@Entity()
export class Driver {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => User)
  @JoinColumn()
  user: User;

  @Column()
  userId: string;

  @OneToMany(() => DriverEarning, (earning) => earning.driver)
  earnings: DriverEarning[];

  @Column()
  licenseNumber: string;

  @Column({
    type: 'enum',
    enum: VehicleType,
    default: VehicleType.OTHER,
  })
  vehicleType: VehicleType;

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

  @Column({ type: 'float', nullable: true })
  currentLatitude: number;

  @Column({ type: 'float', nullable: true })
  currentLongitude: number;

  @Column({ type: 'timestamp', nullable: true })
  lastSeenAt: Date;

  @Column({ default: false })
  isVerified: boolean;

  @Column({ default: false })
  isOnline: boolean;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0.0 })
  rating: number;

  @Column({ type: 'int', default: 0 })
  totalTrips: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0.0 })
  totalEarnings: number;

  @Column({ nullable: true })
  fcmToken: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
