import { EntityManager, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { hash } from 'bcrypt';
// import { Role } from 'src/auth/enums/role.enum';
import { Role } from 'src/roles/entities/role.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    private readonly entityManager: EntityManager,
  ) {}

  async find(uuid: string): Promise<User | null> {
    const user = await this.userRepository.findOneBy({ uuid });

    if (!user) throw new NotFoundException('Użytkonik nie znaleziony');

    return user;
  }

  async findAll(): Promise<User[]> {
    const users = await this.userRepository.find();
    if (!users || users.length === 0) {
      throw new NotFoundException('No users found');
    }
    return users;
  }

  async findOneByEmail(email: string): Promise<User | null> {
    const user = await this.userRepository.findOneBy({
      email,
    });

    if (!user) return null;

    return user;
  }

  async getUserPermissions(userId: string) {
    const user = await this.userRepository.findOneBy({ uuid: userId });

    if (!user) throw new NotFoundException('Użytkonik nie znaleziony');

    const role = await this.roleRepository.findOneBy({ uuid: user.role.uuid });

    if (!role) throw new NotFoundException('Rola nie odnaleziona');

    return role.permissions;
  }

  async create(createUserDto: CreateUserDto) {
    const user = await this.userRepository.findOneBy({
      email: createUserDto.email,
    });

    if (user)
      throw new ConflictException(
        'Użytkownik o tym adresie mailowym już istnieje',
      );

    const hashedPassword = await hash(createUserDto.password, 10);

    const adminRole = await this.roleRepository.findOneBy({
      uuid: '0710061e-bfb9-42f6-8660-3cc9e2a11991',
    });

    const newUser = await this.userRepository.save({
      email: createUserDto.email,
      username: createUserDto.email,
      password: hashedPassword,
      firstName: createUserDto.firstName ?? '',
      lastName: createUserDto.lastName ?? '',
      createdAt: new Date(),
      role: adminRole,
      invintationToken: createUserDto.invintationToken ?? '',
      invintationDate: createUserDto.invintationDate ?? '',
    });

    const { password, ...result } = newUser;

    return result;
  }

  async remove(uuid: string): Promise<User> {
    const user = await this.userRepository.findOneBy({
      uuid: uuid,
    });

    if (!user) new NotFoundException(`User with UUID "${uuid}" not found`);

    this.userRepository.remove(user);

    return user;
  }
}
