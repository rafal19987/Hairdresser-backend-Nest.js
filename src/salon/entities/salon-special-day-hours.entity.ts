import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { SalonSpecialDay } from '@/salon/entities/salon-special-day.entity';
import { timeColumnTransformer } from '@/salon/helpers/time.helper';

@Entity('salon_special_day_hours')
export class SalonSpecialDayHours {
  @PrimaryGeneratedColumn('uuid')
  uuid: string;

  @ManyToOne(() => SalonSpecialDay, specialDay => specialDay.hours, {
    nullable: false,
    onDelete: 'CASCADE',
    orphanedRowAction: 'delete',
  })
  @JoinColumn({ name: 'special_day_id', referencedColumnName: 'uuid' })
  specialDay: SalonSpecialDay;

  @Column({ type: 'time', nullable: false, transformer: timeColumnTransformer })
  opensAt: string;

  @Column({ type: 'time', nullable: false, transformer: timeColumnTransformer })
  closesAt: string;
}
