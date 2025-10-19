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
import {
  IsArray,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsUrl,
  Length,
} from 'class-validator';
import { Calendar } from '@/calendar/entities/calendar.entity';
import { User } from '@/users/entities/user.entity';

@Entity('appointment')
@Index('idx_appointment_name', ['name'])
@Index('idx_appointment_scheduled_at', ['scheduledAt'])
@Index('idx_appointment_calendar', ['calendar'])
export class Appointment {
  @PrimaryGeneratedColumn('uuid')
  uuid: string;

  @ManyToOne(() => Calendar, {
    eager: true,
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'calendar_id', referencedColumnName: 'uuid' })
  @IsNotEmpty({ message: 'Kalendarz jest wymagany' })
  calendar: Calendar;

  @ManyToOne(() => User, { eager: true, nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id', referencedColumnName: 'uuid' })
  @IsNotEmpty({ message: 'Właściciel jest wymagany' })
  owner: User;

  @Column({ type: 'varchar', nullable: false, unique: false })
  @IsNotEmpty({ message: 'Nazwa jest wymagana' })
  name: string;

  @Column({ type: 'varchar', nullable: false, unique: false })
  @IsNotEmpty({ message: 'Typ spotkania jest wymagany' })
  type: string;

  @Column({ type: 'varchar', default: null, nullable: true })
  @IsOptional()
  meetingType?: string;

  @Column({ type: 'varchar', nullable: true })
  @IsOptional()
  @IsUrl({}, { message: 'Podaj poprawny adres URL' })
  meetingLink?: string;

  @Column({ type: 'varchar', nullable: true })
  @IsOptional()
  meetingPhoneNumber?: string;

  @Column({ type: 'varchar', nullable: true })
  @IsOptional()
  eventLocalization?: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  @IsOptional()
  @Length(0, 200, { message: 'Notatka nie może być dłuższa niż 200 znaków' })
  note?: string;

  @Column({ type: 'json', nullable: true })
  @IsOptional()
  @IsArray()
  @IsEmail(
    {},
    { each: true, message: 'Każdy adres musi być poprawnym adresem e-mail' },
  )
  meetingEmailsToNotify?: string[];

  @Column({ type: 'timestamp', nullable: false })
  @IsNotEmpty({ message: 'Data rozpoczęcia jest wymagana' })
  scheduledAt: Date;

  @Column({ type: 'timestamp', nullable: false })
  @IsNotEmpty({ message: 'Data zakończenia jest wymagana' })
  scheduledEndAt: Date;

  @Column({ type: 'int', nullable: true })
  @IsOptional()
  @IsPositive({ message: 'Czas trwania musi być liczbą dodatnią' })
  meetingDuration?: number;

  @Column({ type: 'boolean', default: false })
  deleted: boolean;

  @CreateDateColumn({ type: 'timestamp', nullable: true })
  createdAt?: Date;

  @UpdateDateColumn({ type: 'timestamp', nullable: true })
  lastModifiedAt?: Date;

  @ManyToOne(() => User, { eager: false, nullable: false })
  @JoinColumn({ name: 'created_by_id', referencedColumnName: 'uuid' })
  @IsNotEmpty({ message: 'Twórca jest wymagany' })
  createdBy: User;

  @ManyToOne(() => User, { eager: false, nullable: true })
  @JoinColumn({ name: 'last_modified_by_id', referencedColumnName: 'uuid' })
  @IsOptional()
  lastModifiedBy?: User;

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
