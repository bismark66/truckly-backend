import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
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

  @Column({
    type: 'enum',
    enum: VehicleType,
    default: VehicleType.OTHER,
  })
  vehicleType: VehicleType;

  @Column({ type: 'float', nullable: true })
  currentLatitude: number;

  @Column({ type: 'float', nullable: true })
  currentLongitude: number;

  @Column({ type: 'timestamp', nullable: true })
  lastSeenAt: Date;

  @Column({ default: false })
  isVerified: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

