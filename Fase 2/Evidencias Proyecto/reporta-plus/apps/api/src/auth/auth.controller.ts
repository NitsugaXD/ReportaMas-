import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common'
import { AuthService } from './auth.service'
import { LoginDto } from './dto/login.dto'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { User } from '../common/decorators/user.decorator'

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto.email, dto.password)
  }

  @Post('refresh')
  refresh(@Body('refresh_token') token: string) {
    return this.auth.refresh(token)
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@User('userId') userId: string) {
    return this.auth.me(userId)
  }
}