import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

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

  @Column()
  licenseNumber: string;

  @Column({ nullable: true })
  licenseFrontPageUrl: string;

  @Column({ nullable: true })
  licenseBackPageUrl: string;

  @Column({
    type: 'enum',
    enum: VehicleType,
    default: VehicleType.OTHER,
  })
  vehicleType: VehicleType;

  @Column({ default: false })
  isProfileCompleted: boolean;

  @Column({ type: 'text', nullable: true })
  referralCode: string;

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
