import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Calendar } from '@/calendar/entities/calendar.entity';
import { User } from '@/users/entities/user.entity';
import { Client } from '@/clients/entities/client.entity';
import { UsersServices } from '@/users-services/entities/users-services.entity';
import { AppointmentStatus } from '@/appointment/enums/appointment-status.enum';
import { CancelledBy } from '@/appointment/enums/appointment-cancelled-by.enum';
import { RescheduledBy } from '@/appointment/enums/appointment-rescheduled-by.enum';

@Entity('appointment')
@Index('idx_appointment_scheduled_at', ['scheduledAt'])
@Index('idx_appointment_calendar', ['calendar'])
@Index('idx_appointment_status', ['status'])
export class Appointment {
  @PrimaryGeneratedColumn('uuid')
  uuid: string;

  @ManyToOne(() => Calendar, {
    eager: true,
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'calendar_id', referencedColumnName: 'uuid' })
  calendar: Calendar;

  @ManyToOne(() => Client, {
    eager: true,
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'client_id', referencedColumnName: 'uuid' })
  client?: Client;

  @ManyToOne(() => UsersServices, {
    eager: true,
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'user_service_id', referencedColumnName: 'uuid' })
  userService?: UsersServices;

  @Column({ type: 'varchar', nullable: false })
  name: string;

  @Column({
    type: 'enum',
    enum: AppointmentStatus,
    default: AppointmentStatus.PENDING,
    nullable: false,
  })
  status: AppointmentStatus;

  @Column({
    type: 'decimal',
    precision: 8,
    scale: 2,
    nullable: true,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => (value ? parseFloat(value) : null),
    },
  })
  price?: number;

  @Column({ type: 'int', nullable: true })
  duration?: number;

  @Column({ type: 'varchar', length: 200, nullable: true })
  note?: string;

  @Column({ type: 'varchar', nullable: true })
  meetingLink?: string;

  @Column({ type: 'varchar', nullable: true })
  eventLocalization?: string;

  @Column({ type: 'varchar', nullable: true })
  clientEmail?: string;

  @Column({ type: 'varchar', nullable: true })
  clientPhone?: string;

  @Column({ type: 'timestamp', nullable: false })
  scheduledAt: Date;

  @Column({ type: 'timestamp', nullable: false })
  scheduledEndAt: Date;

  @Column({
    type: 'enum',
    enum: CancelledBy,
    nullable: true,
  })
  cancelledBy?: CancelledBy;

  @Column({ type: 'timestamp', nullable: true })
  cancelledAt?: Date;

  @Column({ type: 'varchar', length: 200, nullable: true })
  cancellationReason?: string;

  @Column({
    type: 'enum',
    enum: RescheduledBy,
    nullable: true,
  })
  rescheduledBy?: RescheduledBy;

  @Column({ type: 'timestamp', nullable: true })
  rescheduledAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  previousScheduledAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  previousScheduledEndAt?: Date;

  @Column({ type: 'boolean', default: false })
  deleted: boolean;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  lastModifiedAt: Date;

  @ManyToOne(() => User, { eager: false, nullable: true })
  @JoinColumn({ name: 'created_by_id', referencedColumnName: 'uuid' })
  createdBy?: User;

  @BeforeInsert()
  setCreatedAt() {
    if (!this.createdAt) {
      this.createdAt = new Date();
    }
  }

  @BeforeUpdate()
  setLastModifiedAt() {
    this.lastModifiedAt = new Date();
  }
}
