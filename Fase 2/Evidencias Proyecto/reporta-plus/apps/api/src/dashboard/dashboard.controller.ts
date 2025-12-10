import { Controller, Get, Query } from '@nestjs/common'
import { DashboardService } from './dashboard.service'
import { User } from '../common/decorators/user.decorator'
import { ForbiddenException } from '@nestjs/common'

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly svc: DashboardService) {}

  private ensureSupervisor(user: any) {
    if (!user) throw new ForbiddenException('No autorizado')
    if (user.role !== 'SUP' && user.role !== 'ADMIN') throw new ForbiddenException('Permiso requerido: supervisor')
  }

  @Get('metrics')
  async metrics(@Query('from') from?: string, @Query('to') to?: string, @Query('tech') tech?: string, @User() user?: any) {
    this.ensureSupervisor(user)
    return this.svc.getMetrics({ from, to, tech })
  }
}