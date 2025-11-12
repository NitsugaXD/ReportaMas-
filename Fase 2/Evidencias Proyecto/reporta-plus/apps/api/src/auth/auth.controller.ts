import { Body, Controller, Get, Post } from '@nestjs/common'
import { AuthService } from './auth.service'
import { LoginDto } from './dto/login.dto'
import { User } from '../common/decorators/user.decorator'
import { Public } from '../common/decorators/public.decorator'

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto.email, dto.password)
  }

  @Public()
  @Post('refresh')
  refresh(@Body('refresh_token') token: string) {
    return this.auth.refresh(token)
  }

  @Get('me')
  me(@User('userId') userId: string) {
    return this.auth.me(userId)
  }
}