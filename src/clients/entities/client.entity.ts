import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class Client {
  @PrimaryGeneratedColumn('uuid')
  uuid: string;

  @Column({ nullable: false, unique: true })
  email: string;

  @Column({ nullable: false, select: false })
  password: string;

  @Column({ nullable: true })
  firstName: string;

  @Column({ nullable: true })
  lastName: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true, type: 'text' })
  notes: string;

  @Column({ default: false, nullable: false })
  marketingConsent: boolean;

  @Column({ default: false, nullable: false })
  emailVerified: boolean;

  @Column({ nullable: true })
  emailVerificationToken: string;

  @Column({ nullable: true, type: 'datetime' })
  emailVerificationDate: Date;

  // Only the SHA-256 hash is stored, so a database leak does not expose working links
  @Column({ type: 'char', length: 64, nullable: true, select: false })
  passwordResetTokenHash: string | null;

  @Column({ type: 'timestamp', nullable: true, select: false })
  passwordResetExpiresAt: Date | null;

  @Column({ default: true, nullable: false })
  active: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
