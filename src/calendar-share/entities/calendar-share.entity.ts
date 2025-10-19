import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { Calendar } from '@/calendar/entities/calendar.entity';
import { IsIn, IsNotEmpty } from 'class-validator';
import { User } from '@/users/entities/user.entity';

@Entity('calendar_share')
@Unique('unique_calendar_shared_user', ['calendar', 'sharedWith'])
@Index('idx_calendar_share_calendar', ['calendar'])
@Index('idx_calendar_share_shared_with', ['sharedWith'])
export class CalendarShare {
  public static readonly PERMISSION_READ = 'read';
  public static readonly PERMISSION_CREATE = 'create';
  public static readonly PERMISSION_WRITE = 'write';
  public static readonly PERMISSION_FULL = 'full';

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
  @JoinColumn({ name: 'shared_with_user_id', referencedColumnName: 'uuid' })
  @IsNotEmpty({ message: 'Użytkownik jest wymagany' })
  sharedWith: User;

  @Column({ type: 'varchar', length: 20, nullable: false, default: 'read' })
  @IsIn(['read', 'create', 'write', 'full'], {
    message: 'Dozwolone poziomy uprawnień: read, create, write, full',
  })
  permission: string;

  @Column({ type: 'boolean', default: true })
  active: boolean;

  @CreateDateColumn({ type: 'timestamp', nullable: true })
  createdAt?: Date;

  @UpdateDateColumn({ type: 'timestamp', nullable: true })
  lastModifiedAt?: Date;

  canRead(): boolean {
    return ['read', 'create', 'write', 'full'].includes(this.permission);
  }

  canCreate(): boolean {
    return ['create', 'write', 'full'].includes(this.permission);
  }

  canWrite(): boolean {
    return ['write', 'full'].includes(this.permission);
  }

  canDelete(): boolean {
    return this.permission === 'full';
  }
}
