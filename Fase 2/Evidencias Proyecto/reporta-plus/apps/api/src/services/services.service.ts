import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateServiceDto, UpdateServiceDto } from './dto/create-service.dto'
import { StorageService } from '../storage/storage.service' // 👈 para upload
import { MailService } from '../mail/mail.service'
import { ServiceStatus } from '@prisma/client'

@Injectable()
export class ServicesService {
  constructor(
    private prisma: PrismaService,
    private storage: StorageService,
    private mail: MailService,
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
        : (await this.prisma.client.create({ data: { name: dto.clientName } })).id
    }
    if (!clientId) {
      throw new BadRequestException('clientId o clientName requerido')
    }

    // 3) Resolver SITE (opcional)
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
            address: dto.siteAddress ?? null,
            clientId,
          },
        })
        siteId = createdSite.id
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

    const where: any = {}

    if (q) {
      where.OR = [
        { serviceUid: { contains: q, mode: 'insensitive' } },
        { type: { contains: q, mode: 'insensitive' } },
        { notes: { contains: q, mode: 'insensitive' } },
        { client: { name: { contains: q, mode: 'insensitive' } } },
        { site: { name: { contains: q, mode: 'insensitive' } } },
      ]
    }

    if (from || to)
      where.date = {
        ...(from ? { gte: new Date(from) } : {}),
        ...(to ? { lte: new Date(to) } : {}),
      }
    if (status) where.status = status
    if (client) where.clientId = client
    if (user.role === 'TECH') where.techId = user.userId
    else if (tech) where.techId = tech

    const page = Number(query.page ?? 1)
    const pageSize = Number(query.pageSize ?? 20)

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

  // ---- Firmar y enviar (actualiza servicio, envía email y registra Report)
  async signAndSend(
    id: string,
    dto: UpdateServiceDto,
    user: { userId: string; role: string },
  ) {
    const existing = await this.prisma.service.findUnique({
      where: { id },
      include: { client: true, site: true, tech: true, files: true },
    })
    if (!existing) throw new NotFoundException('Servicio no encontrado')
    if (user.role === 'TECH' && existing.techId !== user.userId)
      throw new ForbiddenException()
    if (dto.version != null && dto.version !== existing.version) {
      throw new BadRequestException({
        code: 'VERSION_CONFLICT',
        current: existing.version,
      })
    }

    // actualizar datos básicos y marcar como firmado/enviado
    const updated = await this.prisma.service.update({
      where: { id },
      data: {
        ...(dto.type ? { type: dto.type } : {}),
        ...(dto.notes ? { notes: dto.notes } : {}),
        status: (dto.status as any) ?? ServiceStatus.SIGNED,
        version: { increment: 1 },
      },
      include: { client: true, site: true, tech: true, files: true },
    })

    // correos de destino (email principal + adicionales del dto)
    const extraEmails = (dto as any).clientEmails ?? []
    const mainEmail = updated.client.email ? [updated.client.email] : []
    const recipients = Array.from(
      new Set<string>([...mainEmail, ...extraEmails].filter(Boolean as any)),
    )

    if (recipients.length === 0) {
      return updated
    }

    // adjuntos (si hay)
    const pdf = (updated.files as any[]).find(f => f.kind === 'PDF')
    const xlsx = (updated.files as any[]).find(f => f.kind === 'XLSX')

    const attachments: { filename: string; path: string }[] = []
    if (pdf) attachments.push({ filename: 'informe.pdf', path: pdf.url })
    if (xlsx) attachments.push({ filename: 'informe.xlsx', path: xlsx.url })

    const subject = `Informe servicio ${updated.serviceUid}`
    const html = `
      <p>Hola,</p>
      <p>Adjuntamos el informe del servicio <strong>${updated.type}</strong> realizado en <strong>${updated.site?.name ?? ''}</strong>.</p>
      <p>Folio: <strong>${updated.serviceUid}</strong></p>
      <p>Observaciones: ${updated.notes ?? 'Sin observaciones'}</p>
      <br/>
      <p>Saludos cordiales,<br/><strong>Reporta+</strong></p>
    `

    await this.mail.sendServiceReport({
      to: recipients,
      subject,
      html,
      attachments,
    })

    await this.prisma.report.create({
      data: {
        serviceId: updated.id,
        pdfUrl: pdf?.url ?? null,
        xlsxUrl: xlsx?.url ?? null,
        sentTo: recipients,
        sentAt: new Date(),
      },
    })

    return updated
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