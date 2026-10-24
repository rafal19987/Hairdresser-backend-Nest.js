import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('booking_access_token')
@Index('idx_booking_access_token_email', ['email'])
export class BookingAccessToken {
  @PrimaryGeneratedColumn('uuid')
  uuid: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  email: string;

  // SHA-256 of the token; the token itself is only sent by mail
  @Column({ type: 'char', length: 64, nullable: false, unique: true })
  tokenHash: string;

  @Column({ type: 'timestamp', nullable: false })
  expiresAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  lastUsedAt: Date | null;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;
}
