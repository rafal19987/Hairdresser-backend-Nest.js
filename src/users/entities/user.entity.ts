// import { Role } from 'src/auth/enums/role.enum';
import { Role } from 'src/roles/entities/role.entity';
import { RefreshToken } from 'src/auth/entities/refresh-token.entity';
import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  uuid: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column()
  username: string;

  @Column()
  email: string;

  // @Column({
  //   type: 'enum',
  //   enum: Role,
  //   default: Role.ADMIN,
  // })
  // role: Role;
  @ManyToOne(() => Role, (role) => role.name, { eager: true })
  role: Role;

  // @Column({ select: false })
  @Column()
  password: string;

  @Column()
  createdAt: Date;

  @Column()
  invintationToken: string;

  @Column()
  invintationDate: string;

  @OneToMany(() => RefreshToken, (refreshToken) => refreshToken.user)
  refreshTokens: RefreshToken[]; // Relacja z RefreshToken
}
