import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthenticationGuard } from 'src/guards/authentication.guard';
import { Permissions } from 'src/decorators/permissions.decorator';
import { Resource } from 'src/roles/enums/resource.enum';
import { Action } from 'src/roles/enums/action.enum';
import { AuthorizationGuard } from 'src/guards/authorization.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @HttpCode(HttpStatus.OK)
  @Post('login')
  signIn(@Body() signInDto: Record<string, any>) {
    return this.authService.signIn(signInDto.username, signInDto.password);
  }

  @Post('logout')
  async logout(
    @Body('refreshToken') refreshToken: string,
    @Body('accessToken') accessToken: string,
  ): Promise<void> {
    return this.authService.logout(refreshToken, accessToken);
  }

  @UseGuards(AuthenticationGuard, AuthorizationGuard)
  @Permissions([{ resource: Resource.USERS, actions: [Action.READ] }])
  @Get('profile')
  getProfile(@Request() req) {
    return req.userId;
  }
}
