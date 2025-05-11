import { PermissionDto } from '../entities/role.entity';
import { IsArray, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateRoleDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  displayName?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PermissionDto)
  permissions: PermissionDto[];
}
