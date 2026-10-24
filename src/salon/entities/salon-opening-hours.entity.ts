import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Salon } from '@/salon/entities/salon.entity';
import { timeColumnTransformer } from '@/salon/helpers/time.helper';

@Entity('salon_opening_hours')
@Index('idx_salon_opening_hours_day', ['salon', 'dayOfWeek'])
export class SalonOpeningHours {
  @PrimaryGeneratedColumn('uuid')
  uuid: string;

  @ManyToOne(() => Salon, salon => salon.openingHours, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'salon_id', referencedColumnName: 'uuid' })
  salon: Salon;

  // ISO day of week: 1 = Monday, 7 = Sunday
  @Column({ type: 'tinyint', nullable: false })
  dayOfWeek: number;

  @Column({ type: 'time', nullable: false, transformer: timeColumnTransformer })
  opensAt: string;

  @Column({ type: 'time', nullable: false, transformer: timeColumnTransformer })
  closesAt: string;
}
