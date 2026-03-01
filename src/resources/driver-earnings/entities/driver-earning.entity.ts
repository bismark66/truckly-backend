import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Driver } from '../../drivers/entities/driver.entity';

export enum EarningType {
  TRIP_COMPLETION = 'TRIP_COMPLETION',
  BONUS = 'BONUS',
  TIP = 'TIP',
  REFERRAL = 'REFERRAL',
  PENALTY = 'PENALTY',
}

export enum EarningStatus {
  PENDING = 'PENDING',
  PROCESSED = 'PROCESSED',
  PAID = 'PAID',
  DISPUTED = 'DISPUTED',
  CANCELLED = 'CANCELLED',
}

@Entity()
export class DriverEarning {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Driver)
  @JoinColumn()
  driver: Driver;

  @Column()
  driverId: string;

  @Column({ nullable: true })
  tripId: string; // Reference to trip if earning is trip-related

  @Column({
    type: 'enum',
    enum: EarningType,
  })
  type: EarningType;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  grossAmount: number; // Total amount before deductions

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0.0 })
  platformFee: number; // Platform commission/fee

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0.0 })
  tax: number; // Tax deductions

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0.0 })
  otherDeductions: number; // Other deductions (fuel, maintenance, etc.)

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  netAmount: number; // Final amount after all deductions

  @Column({
    type: 'enum',
    enum: EarningStatus,
    default: EarningStatus.PENDING,
  })
  status: EarningStatus;

  @Column({ type: 'date' })
  earningDate: Date; // When the earning was generated

  @Column({ type: 'date', nullable: true })
  payoutDate: Date; // When it was paid out

  @Column({ nullable: true })
  payoutMethod: string; // e.g., 'BANK_TRANSFER', 'MOBILE_MONEY', 'CASH'

  @Column({ nullable: true })
  payoutReference: string; // Transaction reference from payment provider

  @Column({ type: 'text', nullable: true })
  description: string; // Additional details about the earning

  @Column({ type: 'text', nullable: true })
  notes: string; // Internal notes

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
