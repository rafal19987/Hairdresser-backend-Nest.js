import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { SalonOpeningHours } from '@/salon/entities/salon-opening-hours.entity';
import { SalonSpecialDay } from '@/salon/entities/salon-special-day.entity';

@Entity('salon')
export class Salon {
  @PrimaryGeneratedColumn('uuid')
  uuid: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  name: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email: string | null;

  @Column({ type: 'varchar', length: 30, nullable: true })
  phone: string | null;

  @Column({ type: 'varchar', length: 64, default: 'Europe/Warsaw' })
  timeZone: string;

  @Column({ type: 'int', default: 60 })
  clientMinLeadTimeMinutes: number;

  @Column({ type: 'int', default: 60 })
  maxBookingDaysAhead: number;

  @Column({ type: 'int', default: 15 })
  slotIntervalMinutes: number;

  @Column({ type: 'int', default: 24 })
  clientCancellationDeadlineHours: number;

  @Column({ type: 'boolean', default: false })
  autoConfirmClientBookings: boolean;

  @OneToMany(() => SalonOpeningHours, openingHours => openingHours.salon)
  openingHours: SalonOpeningHours[];

  @OneToMany(() => SalonSpecialDay, specialDay => specialDay.salon)
  specialDays: SalonSpecialDay[];

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}
