// import { Role } from 'src/auth/enums/role.enum';
import { Role } from 'src/roles/entities/role.entity';
import { RefreshToken } from 'src/auth/entities/refresh-token.entity';
import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { IsEmail } from 'class-validator';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  uuid: string;

  @Column({ nullable: false, unique: true })
  @IsEmail()
  email: string;

  @Column({ nullable: false, unique: true })
  username: string;

  @Column({ default: null, nullable: true })
  firstName: string;

  @Column({ default: null, nullable: true })
  lastName: string;

  @Column({ default: false, nullable: false })
  active: boolean;

  @Column({ default: false, nullable: false })
  deleted: boolean;

  @ManyToOne(() => Role, role => role.uuid, { eager: true })
  role: Role;

  @Column({ default: null, nullable: true, select: false })
  password: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ default: null, nullable: true })
  invitationToken: string;

  @Column({ type: 'timestamp', default: null, nullable: true })
  invitationDate: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => RefreshToken, refreshToken => refreshToken.user)
  refreshTokens: RefreshToken[];

  @DeleteDateColumn()
  deletedAt: Date;
}
