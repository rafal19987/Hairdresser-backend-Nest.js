import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Client } from '@/clients/entities/client.entity';

@Entity()
export class ClientRefreshToken {
  @PrimaryGeneratedColumn('uuid')
  uuid: string;

  @Column({ nullable: false })
  token: string;

  // nullable, żeby dodanie kolumny nie wywróciło istniejących wierszy - null traktowany jako wygasły
  @Column({ type: 'timestamp', nullable: true })
  expiryDate: Date;

  @ManyToOne(() => Client, { onDelete: 'CASCADE' })
  client: Client;

  @CreateDateColumn()
  createdAt: Date;
}
