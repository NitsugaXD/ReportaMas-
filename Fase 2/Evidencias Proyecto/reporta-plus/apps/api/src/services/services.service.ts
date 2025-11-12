import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateServiceDto, UpdateServiceDto } from './dto/create-service.dto'
import { StorageService } from '../storage/storage.service'

@Injectable()
export class ServicesService {
  constructor(
    private prisma: PrismaService,
    private storage: StorageService, // para subir archivos a MinIO
  ) {}

  // Crear servicio
  async create(dto: CreateServiceDto, user: { userId: string; role: string }) {
    if (user.role === 'TECH' && dto.techId !== user.userId) {
      throw new ForbiddenException('No puedes crear servicios para otro técnico')
    }
    return this.prisma.service.create({
      data: {
        ...dto,
        ...(dto.date ? { date: new Date(dto.date) } : {}),
      },
    })
  }

  // Listar con filtros
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

  // Detalle
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

  // Update con control de versión
  async update(
    id: string,
    dto: UpdateServiceDto,
    user: { userId: string; role: string },
  ) {
    const existing = await this.prisma.service.findUnique({ where: { id } })
    if (!existing) throw new NotFoundException('Servicio no encontrado')
    if (user.role === 'TECH' && existing.techId !== user.userId)
      throw new ForbiddenException()
    if (dto.version != null && dto.version !== existing.version) {
      throw new BadRequestException({
        code: 'VERSION_CONFLICT',
        current: existing.version,
      })
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

  // Upload de archivo a MinIO
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

    const key = `services/${id}/${Date.now()}-${file.originalname.replace(
      /\s+/g,
      '_',
    )}`
    const { url } = await this.storage.uploadBuffer(
      key,
      file.buffer,
      file.mimetype,
    )

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
