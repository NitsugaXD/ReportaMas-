import { Injectable, NotFoundException } from '@nestjs/common'
import { Prisma, PrismaClient } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'
import { CreateClientDto } from './dto/create-client.dto'
import { UpdateClientDto } from './dto/update-client.dto'
import { CreateSiteDto } from './dto/create-site.dto'
import { UpdateSiteDto } from './dto/update-site.dto'

@Injectable()
export class ClientsService {
  constructor(private prisma: PrismaService) {}

  // Clase Clientes
  async createClient(dto: CreateClientDto) {
    return this.prisma.client.create({ data: dto })
  }

  async searchClients(query?: string, page = 1, pageSize = 20) {
    const where: Prisma.ClientWhereInput = query
      ? {
          OR: [
            { name: { contains: query, mode: Prisma.QueryMode.insensitive } },
            { rut: { contains: query, mode: Prisma.QueryMode.insensitive } },
            { email: { contains: query, mode: Prisma.QueryMode.insensitive } },
            { phone: { contains: query, mode: Prisma.QueryMode.insensitive } },
          ],
        }
      : {}

    const [items, total] = await Promise.all([
      this.prisma.client.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.client.count({ where }),
    ])

    return { items, total, page, pageSize }
  }

  async getClient(id: string) {
    const client = await this.prisma.client.findUnique({ where: { id } })
    if (!client) throw new NotFoundException('Cliente no encontrado')
    return client
  }

  async updateClient(id: string, dto: UpdateClientDto) {
    await this.getClient(id)
    return this.prisma.client.update({ where: { id }, data: dto })
  }

  async deleteClient(id: string) {
    await this.getClient(id)
    await this.prisma.client.delete({ where: { id } })
    return { ok: true }
  }

  // Clase Sitios
  async createSite(clientId: string, dto: CreateSiteDto) {
    await this.getClient(clientId)
    return this.prisma.site.create({ data: { ...dto, clientId } })
  }

  async listSites(clientId: string) {
    await this.getClient(clientId)
    return this.prisma.site.findMany({
      where: { clientId },
      orderBy: { name: 'asc' },
    })
  }

  async updateSite(clientId: string, siteId: string, dto: UpdateSiteDto) {
    await this.getClient(clientId)
    const site = await this.prisma.site.findUnique({ where: { id: siteId } })
    if (!site || site.clientId !== clientId) throw new NotFoundException('Sitio no encontrado')
    return this.prisma.site.update({ where: { id: siteId }, data: dto })
  }

  async deleteSite(clientId: string, siteId: string) {
    await this.getClient(clientId)
    const site = await this.prisma.site.findUnique({ where: { id: siteId } })
    if (!site || site.clientId !== clientId) throw new NotFoundException('Sitio no encontrado')
    await this.prisma.site.delete({ where: { id: siteId } })
    return { ok: true }
  }
}
