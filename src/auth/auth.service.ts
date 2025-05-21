import {
  BadRequestException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { UsersService } from 'src/users/users.service';
import { JwtService } from '@nestjs/jwt';
import { RolesService } from 'src/roles/roles.service';
import { RefreshToken } from './entities/refresh-token.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RevokedToken } from './entities/revoked-token.entity';
import {
  USERS_SERVICE,
  UsersServiceInterface,
} from '../users/interfaces/users-service.interface';
import { User } from '../users/entities/user.entity';
import {
  ROLES_SERVICE,
  RolesServiceInterface,
} from '../roles/interfaces/role-service.interface';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(RevokedToken)
    private readonly revokedTokenRepository: Repository<RevokedToken>,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @Inject(ROLES_SERVICE) private readonly rolesService: RolesServiceInterface,
    private readonly jwtService: JwtService,
  ) {}

  async signIn(
    username: string,
    password: string,
  ): Promise<{ accessToken: string; refreshToken: string; userId: string }> {
    if (!username || !password)
      throw new BadRequestException('Podaj login oraz hasło');

    const user = await this.userRepository.findOneBy({ username });

    if (!user) throw new UnauthorizedException('Błędny login lub hasło');

    // const payload = {
    //   sub: user.uuid,
    //   username: user.username,
    //   role: user.role,
    // };

    // return {
    //   access_token: await this.jwtService.signAsync(payload),
    // };

    const tokens = await this.generateUserTokens(user.uuid);

    return {
      ...tokens,
      userId: user.uuid,
    };
  }

  // async refreshTokens(userId: string) {
  //   // const token = await this.RefreshTokenModel.findOne({
  //   //   token: refreshToken,
  //   //   expiryDate: { $gte: new Date() },
  //   // });

  //   // if (!token) {
  //   //   throw new UnauthorizedException('Refresh Token is invalid');
  //   // }
  //   return this.generateUserTokens(token.userId);
  // }

  async generateUserTokens(
    userId: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const accessToken = this.jwtService.sign({ userId }, { expiresIn: '10h' });
    const refreshToken = uuidv4();

    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 7); // Ustawienie ważności na 7 dni

    await this.refreshTokenRepository.save({
      token: refreshToken,
      expiryDate,
      user: { uuid: userId } as any,
    });

    return { accessToken, refreshToken };
  }

  async logout(refreshToken: string, accessToken: string): Promise<void> {
    // Usuń refreshToken z bazy danych
    const result = await this.refreshTokenRepository.delete({
      token: refreshToken,
    });

    if (!result.affected) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Dodaj accessToken do listy unieważnionych
    const payload = this.jwtService.decode(accessToken) as any;
    const expiryDate = new Date(payload.exp * 1000); // Data wygaśnięcia z payloadu

    await this.revokedTokenRepository.save({
      token: accessToken,
      expiryDate,
    });
  }

  async validateUser(username: string, pass: string): Promise<any> {
    const user = await this.userRepository.findOneBy({ username });
    if (user && user.password === pass) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async refreshTokens(
    refreshToken: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const existingToken = await this.refreshTokenRepository.findOne({
      where: { token: refreshToken },
      relations: ['user'],
    });

    if (!existingToken || existingToken.expiryDate < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const newTokens = await this.generateUserTokens(existingToken.user.uuid);

    await this.refreshTokenRepository.delete({ token: refreshToken }); // Usuń stary refresh token

    return newTokens;
  }

  async isAccessTokenRevoked(token: string): Promise<boolean> {
    const revokedToken = await this.revokedTokenRepository.findOne({
      where: { token },
    });
    return !!revokedToken;
  }
}
