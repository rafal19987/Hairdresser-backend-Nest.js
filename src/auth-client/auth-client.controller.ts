import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthClientService } from './auth-client.service';
import { ClientLoginDto } from './dto/client-login.dto';
import { ClientRefreshTokenDto } from './dto/client-refresh-token.dto';

@ApiTags('Auth Client')
@Controller('auth/client')
export class AuthClientController {
  constructor(private readonly authClientService: AuthClientService) {}

  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Body() clientLoginDto: ClientLoginDto) {
    return await this.authClientService.login(clientLoginDto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  async refresh(@Body() clientRefreshTokenDto: ClientRefreshTokenDto) {
    return await this.authClientService.refreshTokens(
      clientRefreshTokenDto.refreshToken,
    );
  }

  @HttpCode(HttpStatus.OK)
  @Post('logout')
  async logout(@Body() clientRefreshTokenDto: ClientRefreshTokenDto) {
    return await this.authClientService.logout(
      clientRefreshTokenDto.refreshToken,
    );
  }
}
