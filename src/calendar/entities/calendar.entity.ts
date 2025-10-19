import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { IsNotEmpty, IsOptional, Length, Matches } from 'class-validator';
import { User } from '@/users/entities/user.entity';

@Entity('calendar')
@Index('idx_calendar_owner', ['owner'])
@Index('idx_calendar_name', ['name'])
@Index('idx_calendar_deleted', ['deleted'])
export class Calendar {
  @PrimaryGeneratedColumn('uuid')
  uuid: string;

  @Column({ type: 'varchar', nullable: false })
  @IsNotEmpty({ message: 'Nazwa kalendarza jest wymagana' })
  @Length(1, 255, { message: 'Nazwa nie może być dłuższa niż 255 znaków' })
  name: string;

  @ManyToOne(() => User, { eager: true, nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'owner_id', referencedColumnName: 'uuid' })
  @IsNotEmpty({ message: 'Właściciel kalendarza jest wymagany' })
  owner: User;

  @Column({ type: 'varchar', length: 7, nullable: true })
  @IsOptional()
  @Matches(/^#[0-9A-Fa-f]{6}$/, {
    message: 'Kolor musi być w formacie HEX, np. #FF5733',
  })
  color?: string;

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @Length(0, 500, { message: 'Opis nie może być dłuższy niż 500 znaków' })
  description?: string;

  @Column({ type: 'boolean', default: false })
  isDefault: boolean;

  @Column({ type: 'boolean', default: true })
  active: boolean;

  @Column({ type: 'boolean', default: false })
  deleted: boolean;

  @CreateDateColumn({ type: 'timestamp', nullable: true })
  createdAt?: Date;

  @UpdateDateColumn({ type: 'timestamp', nullable: true })
  lastModifiedAt?: Date;
}
