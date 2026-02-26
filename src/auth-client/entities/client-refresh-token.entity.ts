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

  @ManyToOne(() => Client, { onDelete: 'CASCADE' })
  client: Client;

  @CreateDateColumn()
  createdAt: Date;
}
