import { Injectable, UnauthorizedException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'
import * as bcrypt from 'bcryptjs'

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  async validateUser(email: string, pass: string) {
    const user = await this.prisma.user.findUnique({ where: { email } })
    if (!user || !user.active) throw new UnauthorizedException('Credenciales inválidas')
    const ok = await bcrypt.compare(pass, user.password)
    if (!ok) throw new UnauthorizedException('Credenciales inválidas')
    return user
  }

  private signAccess(u: any) {
    return this.jwt.sign(
      { sub: u.id, email: u.email, role: u.role },
      { secret: this.config.get('JWT_SECRET'), expiresIn: this.config.get('JWT_EXPIRES') || '15m' },
    )
  }
  private signRefresh(u: any) {
    return this.jwt.sign(
      { sub: u.id, email: u.email, role: u.role },
      { secret: this.config.get('JWT_REFRESH_SECRET'), expiresIn: this.config.get('JWT_REFRESH_EXPIRES') || '7d' },
    )
  }

  async login(email: string, password: string) {
    const user = await this.validateUser(email, password)
    return {
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      access_token: this.signAccess(user),
      refresh_token: this.signRefresh(user),
    }
  }

  async refresh(refresh_token: string) {
    try {
      const payload = await this.jwt.verifyAsync(refresh_token, {
        secret: this.config.get('JWT_REFRESH_SECRET'),
      })
      const user = await this.prisma.user.findUnique({ where: { id: payload.sub } })
      if (!user || !user.active) throw new UnauthorizedException()
      return { access_token: this.signAccess(user), refresh_token: this.signRefresh(user) }
    } catch {
      throw new UnauthorizedException('Refresh token inválido')
    }
  }

  async me(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, role: true, active: true },
    })
  }
}
