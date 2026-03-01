import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
} from 'typeorm';
import { Booking } from '../../bookings/entities/booking.entity';
import { User } from '../../users/entities/user.entity';
import { Driver } from '../../drivers/entities/driver.entity';

@Entity()
export class Conversation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => Booking)
  @JoinColumn()
  booking: Booking;

  @Column()
  bookingId: string;

  @ManyToOne(() => User)
  customer: User;

  @Column()
  customerId: string;

  @ManyToOne(() => Driver)
  driver: Driver;

  @Column()
  driverId: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
