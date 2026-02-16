import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Vehicle } from '../../vehicles/entities/vehicle.entity';

@Entity('fleet_owner')
export class FleetOwner {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => User)
  @JoinColumn()
  user: User;

  @Column()
  userId: string;

  @Column()
  companyName: string;

  @Column({ nullable: true })
  registrationNumber: string;

  @Column({ nullable: true })
  dotNumber: string;

  @Column({ nullable: true })
  mcNumber: string;

  @Column({ nullable: true })
  fleetSize: string;

  @Column({ type: 'simple-array', nullable: true })
  vehicleTypes: string[];

  @Column({ type: 'simple-array', nullable: true })
  operatingRegions: string[];

  @Column({ nullable: true })
  monthlyLoads: string;

  @Column({ default: false })
  isVerified: boolean;

  @OneToMany(() => Vehicle, (vehicle) => vehicle.fleetOwner)
  vehicles: Vehicle[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
