import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Salon } from '@/salon/entities/salon.entity';
import { SalonSpecialDayHours } from '@/salon/entities/salon-special-day-hours.entity';

@Entity('salon_special_day')
@Index('uq_salon_special_day_date', ['salon', 'date'], { unique: true })
export class SalonSpecialDay {
  @PrimaryGeneratedColumn('uuid')
  uuid: string;

  @ManyToOne(() => Salon, salon => salon.specialDays, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'salon_id', referencedColumnName: 'uuid' })
  salon: Salon;

  @Column({ type: 'date', nullable: false })
  date: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  name: string | null;

  @Column({ type: 'boolean', default: false })
  isClosed: boolean;

  @OneToMany(() => SalonSpecialDayHours, hours => hours.specialDay, {
    cascade: true,
  })
  hours: SalonSpecialDayHours[];

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}
