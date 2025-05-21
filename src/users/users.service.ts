import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { hash } from 'bcrypt';
import { Role } from 'src/roles/entities/role.entity';
import { PaginationParamsDto } from '@/common/dto/pagination-params.dto';
import { PaginatedResultDto } from '@/common/dto/paginated-result.dto';
import { createPaginatedResponse } from '@/common/helpers/pagination.helper';
import { ResponseHelper } from '@/common/helpers/response.helper';
import { ResponseDto } from '@/common/dto/response.dto';
import { UserNotFoundException } from './exceptions/user-not-found.exception';
import { UsersServiceInterface } from './interfaces/users-service.interface';
import { UserAlreadyExistsException } from './exceptions/user-already-exists.exception';
import { EditUserDto } from './dto/edit-user.dto';
import { RoleNotFoundException } from '@/roles/exceptions/role-not-found.exception';
import { UserIsNotDeletedException } from './exceptions/user-is-not-deleted.exception';

@Injectable()
export class UsersService implements UsersServiceInterface {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
  ) {}

  public async find(uuid: string): Promise<ResponseDto> {
    const user = await this.userRepository.findOneBy({ uuid });

    if (!user) throw new UserNotFoundException();

    return ResponseHelper.success('User found', HttpStatus.OK, user);
  }

  public async findDeletedAll(
    paginationParams: PaginationParamsDto,
  ): Promise<PaginatedResultDto<User>> {
    const { page, limit } = paginationParams;

    const skip = (page - 1) * limit;

    const [users, total] = await this.userRepository.findAndCount({
      skip,
      take: limit,
      where: [{ deleted: true }],
      withDeleted: true,
      order: { createdAt: 'DESC' },
    });

    if (!users || users.length === 0) {
      throw new NotFoundException('No deleted users found');
    }

    return createPaginatedResponse(users, total, paginationParams);
  }

  public async findAll(
    paginationParams: PaginationParamsDto,
  ): Promise<PaginatedResultDto<User>> {
    const { page, limit } = paginationParams;

    const skip = (page - 1) * limit;

    const [users, total] = await this.userRepository.findAndCount({
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    if (!users || users.length === 0) {
      throw new NotFoundException('No users found');
    }

    return createPaginatedResponse(users, total, paginationParams);
  }

  public async create(createUserDto: CreateUserDto) {
    let role = null;

    const user = await this.userRepository.findOneBy({
      email: createUserDto.email,
    });

    if (user) throw new UserAlreadyExistsException();

    const hashedPassword = await hash(createUserDto.password, 10);

    if (createUserDto.role !== null) {
      role = await this.roleRepository.findOneBy({
        uuid: createUserDto.role,
      });

      if (!role) {
        throw new RoleNotFoundException();
      }
    }

    const newUser = await this.userRepository.save({
      email: createUserDto.email,
      username: createUserDto.email,
      password: hashedPassword,
      firstName: createUserDto.firstName,
      lastName: createUserDto.lastName,
      role,
      active: createUserDto.active,
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...result } = newUser;

    return ResponseHelper.created('User successfully created', result);
  }

  public async update(
    uuid: string,
    editUserDto: EditUserDto,
  ): Promise<ResponseDto> {
    const user = await this.userRepository.findOneBy({
      uuid,
    });

    if (!user) throw new UserNotFoundException();

    user.firstName = editUserDto.firstName;
    user.lastName = editUserDto.lastName;
    user.email = editUserDto.email;
    user.active = editUserDto.active;

    if (editUserDto.role !== null) {
      const role = await this.roleRepository.findOneBy({
        uuid: editUserDto.role,
      });

      if (!role) {
        throw new RoleNotFoundException();
      }

      user.role = role;
    }

    await this.userRepository.save(user);

    return ResponseHelper.updated('User successfully updated', user.uuid);
  }

  public async remove(uuid: string): Promise<ResponseDto> {
    const user = await this.userRepository.findOne({
      where: { uuid: uuid },
      withDeleted: true,
    });

    if (!user) throw new UserNotFoundException();

    await this.userRepository.remove(user);

    return ResponseHelper.deleted('User successfully deleted');
  }

  public async softDelete(uuid: string): Promise<ResponseDto> {
    const user = await this.userRepository.findOneBy({
      uuid: uuid,
    });

    if (!user) throw new UserNotFoundException();

    user.deleted = true;
    user.active = false;
    user.password = '';

    await this.userRepository.save(user);

    await this.userRepository.softDelete({ uuid });

    return ResponseHelper.softDeleted('User successfully soft deleted');
  }

  public async getUserPermissions(userId: string) {
    const user = await this.userRepository.findOneBy({ uuid: userId });

    if (!user) throw new UserNotFoundException();

    const role = await this.roleRepository.findOneBy({ uuid: user.role.uuid });

    if (!role) throw new RoleNotFoundException();

    return role.permissions;
  }

  public async restore(uuid: string): Promise<ResponseDto> {
    const user = await this.userRepository.findOne({
      where: { uuid: uuid },
      withDeleted: true,
    });

    if (!user) throw new UserNotFoundException();

    if (!user.deleted) throw new UserIsNotDeletedException();

    // Set deleted flag to false
    user.deleted = false;

    // Save the changes
    await this.userRepository.save(user);

    // Use TypeORM's recover method to clear deletedAt
    await this.userRepository.recover({ uuid });

    return ResponseHelper.restored('User successfully restored');
  }
}
