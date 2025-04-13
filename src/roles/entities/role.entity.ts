import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Resource } from '../enums/resource.enum';
import { Action } from '../enums/action.enum';
import { User } from 'src/users/entities/user.entity';

@Entity()
export class Role {
  @PrimaryGeneratedColumn('uuid')
  uuid: string;

  @OneToMany(() => User, (user) => user.role)
  name: string;

  @Column()
  description?: string;

  @Column({ type: 'json' })
  permissions: Permission[];
}

@Entity()
export class Permission {
  @Column({ type: 'enum', enum: Resource })
  resource: Resource;

  @Column({ type: 'enum', enum: Action })
  actions: Action[];
}
