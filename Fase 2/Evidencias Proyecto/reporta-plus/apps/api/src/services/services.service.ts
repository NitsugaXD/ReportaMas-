import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateServiceDto, UpdateServiceDto } from './dto/create-service.dto'
import { StorageService } from '../storage/storage.service' // 👈 para upload

@Injectable()
export class ServicesService {
  constructor(
    private prisma: PrismaService,
    private storage: StorageService, // 👈 inyectamos storage
  ) {}

  // ---- Crear servicio con find-or-create
  async create(dto: CreateServiceDto, user: { userId: string; role: string }) {
    // 1) Determinar técnico
    const techId = user.role === 'TECH' ? user.userId : dto.techId
    if (!techId) throw new BadRequestException('techId requerido')

    // 2) Resolver CLIENTE (obligatorio por schema)
    let clientId: string | undefined = dto.clientId
    if (!clientId && dto.clientName) {
      const existing = await this.prisma.client.findFirst({
        where: { name: { equals: dto.clientName, mode: 'insensitive' } },
      })
      clientId = existing
        ? existing.id
        : (await this.prisma.client.create({ data: { name: dto.clientName } }))
            .id
    }
    if (!clientId) {
      throw new BadRequestException(
        'client requerido: envía clientId o clientName',
      )
    }

    // 3) Resolver SITIO (opcional en schema, pero si viene nombre debe pertenecer al cliente)
    let siteId: string | undefined = dto.siteId
    if (!siteId && dto.siteName) {
      const existingSite = await this.prisma.site.findFirst({
        where: {
          name: { equals: dto.siteName, mode: 'insensitive' },
          clientId,
        },
      })
      if (existingSite) siteId = existingSite.id
      else {
        const createdSite = await this.prisma.site.create({
          data: {
            name: dto.siteName,
            address: dto.siteAddress || null,
            // 👇 relación obligatoria
            client: { connect: { id: clientId } },
          },
        })
        siteId = createdSite.id
      }
    } else if (siteId) {
      const exists = await this.prisma.site.findUnique({ where: { id: siteId } })
      if (!exists) throw new BadRequestException('siteId no existe')
      // (opcional) validar que el site pertenece al clientId resuelto
      if (exists.clientId !== clientId) {
        throw new BadRequestException('siteId no pertenece al client indicado')
      }
    }

    // 4) Seguridad
    if (user.role === 'TECH' && techId !== user.userId) {
      throw new ForbiddenException('No puedes crear servicios para otro técnico')
    }

    // 5) Crear servicio conectando relaciones (client obligatorio, site opcional)
    return this.prisma.service.create({
      data: {
        serviceUid: dto.serviceUid,
        type: dto.type,
        notes: dto.notes || null,
        ...(dto.date ? { date: new Date(dto.date) } : {}),

        tech: { connect: { id: techId } },
        client: { connect: { id: clientId } }, // 👈 requerido
        ...(siteId ? { site: { connect: { id: siteId } } } : {}),
      },
      include: { client: true, site: true, tech: true, files: true },
    })
  }

  // ---- Listar
  async findMany(query: any, user: { userId: string; role: string }) {
    const { q, from, to, tech, client, status } = query
    const page = Number(query.page ?? 1)
    const pageSize = Number(query.pageSize ?? 20)

    const where: any = {}
    if (q)
      where.OR = [
        { type: { contains: q, mode: 'insensitive' } },
        { notes: { contains: q, mode: 'insensitive' } },
        { serviceUid: { contains: q, mode: 'insensitive' } },
      ]
    if (from || to)
      where.date = {
        ...(from ? { gte: new Date(from) } : {}),
        ...(to ? { lte: new Date(to) } : {}),
      }
    if (status) where.status = status
    if (client) where.clientId = client
    if (user.role === 'TECH') where.techId = user.userId
    else if (tech) where.techId = tech

    const [items, total] = await Promise.all([
      this.prisma.service.findMany({
        where,
        orderBy: { date: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { client: true, site: true, tech: true, files: true },
      }),
      this.prisma.service.count({ where }),
    ])

    return { items, total, page, pageSize }
  }

  // ---- Obtener uno
  async getOne(id: string, user: { userId: string; role: string }) {
    const s = await this.prisma.service.findUnique({
      where: { id },
      include: { client: true, site: true, tech: true, files: true },
    })
    if (!s) throw new NotFoundException('Servicio no encontrado')
    if (user.role === 'TECH' && s.techId !== user.userId)
      throw new ForbiddenException()
    return s
  }

  // ---- Actualizar
  async update(id: string, dto: UpdateServiceDto, user: { userId: string; role: string }) {
    const existing = await this.prisma.service.findUnique({ where: { id } })
    if (!existing) throw new NotFoundException('Servicio no encontrado')
    if (user.role === 'TECH' && existing.techId !== user.userId)
      throw new ForbiddenException()
    if (dto.version != null && dto.version !== existing.version) {
      throw new BadRequestException({ code: 'VERSION_CONFLICT', current: existing.version })
    }
    return this.prisma.service.update({
      where: { id },
      data: {
        ...(dto.type ? { type: dto.type } : {}),
        ...(dto.notes ? { notes: dto.notes } : {}),
        ...(dto.status ? { status: dto.status as any } : {}),
        version: { increment: 1 },
      },
    })
  }

  // ---- Subir archivo (foto, firma, PDF, XLSX)
  async uploadFile(
    id: string,
    file: Express.Multer.File,
    kind: 'PHOTO' | 'SIGNATURE' | 'PDF' | 'XLSX',
    user: { userId: string; role: string },
  ) {
    const s = await this.prisma.service.findUnique({ where: { id } })
    if (!s) throw new NotFoundException('Servicio no encontrado')
    if (user.role === 'TECH' && s.techId !== user.userId)
      throw new ForbiddenException()

    const key = `services/${id}/${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`
    const { url } = await this.storage.uploadBuffer(key, file.buffer, file.mimetype)

    return this.prisma.serviceFile.create({
      data: {
        serviceId: id,
        kind: kind as any,
        url,
        meta: { size: file.size, type: file.mimetype, key },
      },
    })
  }
}