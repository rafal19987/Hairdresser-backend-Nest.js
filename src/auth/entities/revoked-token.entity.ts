import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity()
export class RevokedToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  token: string;

  @CreateDateColumn()
  createdAt: Date; // Data dodania tokena do listy unieważnionych

  @Column()
  expiryDate: Date; // Data wygaśnięcia tokena
}
