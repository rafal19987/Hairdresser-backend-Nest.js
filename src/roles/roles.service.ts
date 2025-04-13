import { InjectRepository } from '@nestjs/typeorm';
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { CreateRoleDto } from './dto/create-role.dto';
import { Role } from './entities/role.entity';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
  ) {}

  async createRole(createRoleDto: CreateRoleDto) {
    const role = await this.roleRepository.findOneBy({
      name: createRoleDto.name,
    });

    if (role) throw new ConflictException('Rola o takiej nazwie już istnieje');

    const newRole = this.roleRepository.save(createRoleDto);

    return newRole;
  }

  async getRoleById(roleId: string) {
    const role = await this.roleRepository.findOneBy({ uuid: roleId });

    if (!role) throw new NotFoundException('Podana rola nie znaleziona');

    return role;
  }

  async getRoleByName(name: string) {
    const role = await this.roleRepository.findOneBy({ name });

    if (!role) throw new NotFoundException('Podana rola nie znaleziona');

    return role;
  }
}
