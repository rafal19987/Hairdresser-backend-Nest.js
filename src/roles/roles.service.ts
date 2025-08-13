import { InjectRepository } from '@nestjs/typeorm';
import { Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { CreateRoleDto } from './dto/create-role.dto';
import { Role } from './entities/role.entity';
import { ResponseDto } from '@/common/dto/response.dto';
import { ResponseHelper } from '@/common/helpers/response.helper';
import { RolesServiceInterface } from './interfaces/role-service.interface';
import { RoleAlreadyExistsException } from './exceptions/role-already-exists.exception';
import { RoleNotFoundException } from './exceptions/role-not-found.exception';
import { PaginationParamsDto } from '@/common/dto/pagination-params.dto';
import { PaginatedResultDto } from '@/common/dto/paginated-result.dto';
import { createPaginatedResponse } from '@/common/helpers/pagination.helper';

@Injectable()
export class RolesService implements RolesServiceInterface {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
  ) {}

  public async findAll(
    paginationParams: PaginationParamsDto,
  ): Promise<PaginatedResultDto<Role>> {
    const { page, limit } = paginationParams;

    const skip = (page - 1) * limit;

    const [roles, total] = await this.roleRepository.findAndCount({
      skip,
      take: limit,
    });

    if (!roles || roles.length === 0) {
      throw new NotFoundException('No roles found');
    }

    return createPaginatedResponse(roles, total, paginationParams);
  }

  async create(createRoleDto: CreateRoleDto): Promise<ResponseDto> {
    const role = await this.roleRepository.findOneBy({
      name: createRoleDto.name,
    });

    if (role) throw new RoleAlreadyExistsException();

    const result = await this.roleRepository.save(createRoleDto);

    return ResponseHelper.created('Role successfully created', result);
  }

  async getRoleById(roleId: string): Promise<Role> {
    const role = await this.roleRepository.findOneBy({ uuid: roleId });

    if (!role) throw new RoleNotFoundException();

    return role;
  }

  async getRoleByName(name: string): Promise<Role> {
    const role = await this.roleRepository.findOneBy({ name });

    if (!role) throw new RoleNotFoundException();

    return role;
  }
}
