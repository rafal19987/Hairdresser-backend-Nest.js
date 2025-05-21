import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { Resource } from '../enums/resource.enum';
import { Action } from '../enums/action.enum';
import { IsArray, IsEnum } from 'class-validator';

@Entity()
export class Role {
  @PrimaryGeneratedColumn('uuid')
  uuid: string;

  @Column({ nullable: false, unique: true })
  name: string;

  @Column()
  displayName?: string;

  @Column({ type: 'json' })
  permissions: PermissionDto[];
}

export class PermissionDto {
  @IsEnum(Resource)
  resource: Resource;

  @IsEnum(Action, { each: true })
  @IsArray()
  actions: Action[];
}
