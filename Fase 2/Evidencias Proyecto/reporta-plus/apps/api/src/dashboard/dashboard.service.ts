import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getMetrics(params: { from?: string; to?: string; tech?: string }) {
    const where: any = {}
    if (params.from || params.to) where.date = {}
    if (params.from) where.date.gte = new Date(params.from)
    if (params.to) where.date.lte = new Date(params.to)
    if (params.tech) where.techId = params.tech

    const statusesRaw: any[] = await this.prisma.service.groupBy({
      by: ['status'],
      _count: { id: true },
      where,
    } as any)

    const totalsByStatus: Record<string, number> = {}
    for (const s of statusesRaw) {
      const statusKey = s.status ?? 'UNKNOWN'
      const count = (s._count && typeof s._count === 'object' ? (s._count.id ?? 0) : Number(s._count ?? 0))
      totalsByStatus[statusKey] = Number(count || 0)
    }

    const byTechRaw: any[] = await this.prisma.service.groupBy({
      by: ['techId'],
      _count: { id: true },
      where,
    } as any)

    const techIds = byTechRaw.map(b => b.techId).filter(Boolean)
    const techUsers = techIds.length > 0
      ? await this.prisma.user.findMany({ where: { id: { in: techIds } }, select: { id: true, name: true } })
      : []

    const totalsByTech = byTechRaw.map(b => ({
      techId: b.techId,
      count: Number((b._count && b._count.id) ?? 0),
      name: techUsers.find(t => t.id === b.techId)?.name || 'Sin nombre',
    }))

    const lastServices = await this.prisma.service.findMany({
      where,
      orderBy: { date: 'desc' },
      take: 10,
      include: { client: true, site: true, tech: true },
    })

    const topClientsGroupRaw: any[] = await this.prisma.service.groupBy({
      by: ['clientId'],
      _count: { id: true },
      where,
    } as any)

    const topClientIds = topClientsGroupRaw.map(c => c.clientId).filter(Boolean)
    const clients = topClientIds.length > 0
      ? await this.prisma.client.findMany({ where: { id: { in: topClientIds } }, select: { id: true, name: true } })
      : []

    const topClients = topClientsGroupRaw
      .map(c => ({
        clientId: c.clientId,
        count: Number((c._count && c._count.id) ?? 0),
        name: clients.find(cl => cl.id === c.clientId)?.name || 'Sin nombre',
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    return { totalsByStatus, totalsByTech, lastServices, topClients }
  }
}