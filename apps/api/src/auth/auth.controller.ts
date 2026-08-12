import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../common/current-user.decorator';
import { Public } from '../common/public.decorator';
import type { AuthUser } from '../common/auth-user';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { GuestDto } from './dto/guest.dto';
import { RefreshDto } from './dto/refresh.dto';
import { RegisterDto } from './dto/register.dto';
import { AuthRateLimitGuard } from './auth-rate-limit.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}
  @Public() @UseGuards(AuthRateLimitGuard) @Post('register') register(
    @Body() dto: RegisterDto,
  ) {
    return this.auth.register(dto);
  }
  @Public() @UseGuards(AuthRateLimitGuard) @Post('login') login(
    @Body() dto: LoginDto,
  ) {
    return this.auth.login(dto);
  }
  @Public() @UseGuards(AuthRateLimitGuard) @Post('guest') guest(
    @Body() dto: GuestDto,
  ) {
    return this.auth.guest(dto);
  }
  @Public() @UseGuards(AuthRateLimitGuard) @Post('refresh') refresh(
    @Body() dto: RefreshDto,
  ) {
    return this.auth.refresh(dto.refreshToken);
  }
  @Post('logout') logout(@CurrentUser() user: AuthUser) {
    return this.auth.logout(user.id);
  }
  @Get('me') me(@CurrentUser() user: AuthUser) {
    return this.auth.me(user.id);
  }
}
