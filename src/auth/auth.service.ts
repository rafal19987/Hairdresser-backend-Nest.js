import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { JwtService } from '@nestjs/jwt';
import { RefreshToken } from './entities/refresh-token.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RevokedToken } from './entities/revoked-token.entity';
import { User } from '@/users/entities/user.entity';
import { compare, hash } from 'bcrypt';
import { SetPasswordDto } from '@/auth/dto/set-password.dto';
import { ResponseDto } from '@/common/dto/response.dto';
import { ResponseHelper } from '@/common/helpers/response.helper';
import { InvalidTokenException } from '@/auth/exceptions/invalid-token.exception';
import { TokenExpiredException } from '@/auth/exceptions/token-expired.exception';
import { InvalidCredentialsException } from '@/auth/exceptions/invalid-credentials.exception';
import { InvalidRefreshTokenException } from '@/auth/exceptions/invalid-refresh-token.exception';
import { TokenRevokedException } from '@/auth/exceptions/token-revoked.exception';
import { PasswordsNotMatchException } from '@/auth/exceptions/passwords-not-match.exception';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(RevokedToken)
    private readonly revokedTokenRepository: Repository<RevokedToken>,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async signIn(
    username: string,
    password: string,
  ): Promise<{ accessToken: string; refreshToken: string; user: Omit<User, 'password'> }> {
      if (!username || !password) throw new BadRequestException('Podaj login oraz hasło');

      const user = await this.validateUser(username, password);

      if (!user) throw new InvalidCredentialsException()

      const tokens = await this.generateUserTokens(user.uuid);

      return {
          ...tokens,
          user
      };
  }

  async generateUserTokens(
    userId: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
      const accessToken = this.jwtService.sign({userId});
    const refreshToken = uuidv4();

    const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 7);

    await this.refreshTokenRepository.save({
      token: refreshToken,
      expiryDate,
      user: { uuid: userId } as any,
    });

    return { accessToken, refreshToken };
  }

  async logout(refreshToken: string, accessToken: string): Promise<void> {
    const result = await this.refreshTokenRepository.delete({
      token: refreshToken,
    });

    if (!result.affected) {
      if (!result.affected) throw new InvalidRefreshTokenException();
    }

    const payload = this.jwtService.decode(accessToken) as any;
      const expiryDate = new Date(payload.exp * 1000);

    await this.revokedTokenRepository.save({
      token: accessToken,
      expiryDate,
    });
  }

    async validateUser(username: string, pass: string): Promise<Omit<User, 'password'> | null> {
        const user = await this.userRepository.findOne({
            where: {username},
            select: {
                uuid: true,
                username: true,
                email: true,
                firstName: true,
                lastName: true,
                active: true,
                deleted: true,
                password: true,
            },
            relations: ['role'],
        });

        if (!user || !user.password || !user.active) return null;

        const isPasswordValid = await compare(pass, user.password);
        if (!isPasswordValid) return null;

        const {password, ...result} = user;
        return result as Omit<User, 'password'>;
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

  async signInUsingToken(
    accessToken: string,
  ): Promise<{ user: User; newAccessToken?: string }> {
    try {
      const isRevoked = await this.isAccessTokenRevoked(accessToken);
      if (isRevoked) throw new TokenRevokedException()

      const payload = this.jwtService.verify(accessToken) as { userId: string };

      const user = await this.userRepository.findOne({
        where: { uuid: payload.userId },
        relations: ['role'],
      });

      if (!user || !user.active) {
        throw new UnauthorizedException('User not found or inactive');
      }

      const decoded = this.jwtService.decode(accessToken) as any;
      const expirationTime = decoded.exp * 1000;
      const oneHourFromNow = Date.now() + 60 * 60 * 1000;

      let newAccessToken: string | undefined;

      if (expirationTime < oneHourFromNow) {
          newAccessToken = this.jwtService.sign({userId: user.uuid});
      }

      return {
        user,
        newAccessToken,
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }

  async setPassword(token: string, setPasswordDto: SetPasswordDto): Promise<ResponseDto> {
    const user = await this.userRepository.findOneBy({
      invitationToken: token,
    });

    if (!user) throw new InvalidTokenException();

    const tokenExpiryDate = new Date(user.invitationDate);
    tokenExpiryDate.setHours(tokenExpiryDate.getHours() + 48);

    if (new Date() > tokenExpiryDate) {
      throw new TokenExpiredException();
    }

    if (setPasswordDto.password !== setPasswordDto.repeatPassword) throw new PasswordsNotMatchException();

    user.password = await hash(setPasswordDto.password, 10);
    user.active = true;
    user.invitationToken = null;

    await this.userRepository.save(user);

    return ResponseHelper.success('Hasło zostało ustawione, możesz się zalogować');
  }
}
