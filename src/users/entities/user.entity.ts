import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum UserRole {
  ADMIN = 'ADMIN',
  CUSTOMER = 'CUSTOMER',
  DRIVER = 'DRIVER',
  FLEET_OWNER = 'FLEET_OWNER',
}

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ select: false })
  password?: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ nullable: true })
  phoneNumber: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.CUSTOMER,
  })
  role: UserRole;

  @Column({ nullable: true })
  avatar: string;

  @Column({ default: false })
  isVerified: boolean;

  @Column({ nullable: true, unique: true })
  googleId: string;

  @Column({ nullable: true, select: false })
  refreshToken: string;

  @Column({ nullable: true, select: false })
  resetPasswordToken: string;

  @Column({ type: 'timestamp', nullable: true })
  resetPasswordExpires: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Computed property for API compatibility
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`.trim();
  }
}
