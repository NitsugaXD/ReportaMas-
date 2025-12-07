import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateServiceDto, UpdateServiceDto } from './dto/create-service.dto'
import { StorageService } from '../storage/storage.service'
import { MailService } from '../mail/mail.service'
import { ServiceStatus, FileKind } from '@prisma/client'
import { PdfService } from '../pdf/pdf.service'

type Attachment = {
  filename: string
  content?: Buffer | string
  path?: string
  contentType?: string
}

@Injectable()
export class ServicesService {
  private readonly logger = new Logger(ServicesService.name)

  constructor(
    private prisma: PrismaService,
    private storage: StorageService,
    private mail: MailService,
    private pdfService: PdfService,
  ) {}

  // 1. CREAR
  async create(dto: CreateServiceDto, user: { userId: string; role: string }) {
    const techId = user.role === 'TECH' ? user.userId : (dto.techId || user.userId)
    if (!techId) throw new BadRequestException('techId requerido')

    // Find-or-Create Cliente
    let clientId: string | undefined = dto.clientId
    if (!clientId && dto.clientName) {
      const existing = await this.prisma.client.findFirst({
        where: { name: { equals: dto.clientName, mode: 'insensitive' } },
      })
      if (existing) {
        clientId = existing.id
        if (dto.clientEmail && !existing.email) {
          await this.prisma.client.update({ where: { id: clientId }, data: { email: dto.clientEmail } })
        }
      } else {
        const newClient = await this.prisma.client.create({
          data: {
            name: dto.clientName,
            email: dto.clientEmail ?? null,
            phone: dto.clientPhone ?? null,
          },
        })
        clientId = newClient.id
      }
    }
    if (!clientId) throw new BadRequestException('Falta cliente')

    // Find-or-Create Sitio
    let siteId = dto.siteId
    if (!siteId && dto.siteName) {
      const existingSite = await this.prisma.site.findFirst({
        where: { name: { equals: dto.siteName, mode: 'insensitive' }, clientId },
      })
      siteId = existingSite ? existingSite.id : (await this.prisma.site.create({
        data: { name: dto.siteName, address: dto.siteAddress, clientId },
      })).id
    }

    return this.prisma.service.create({
      data: {
        serviceUid: dto.serviceUid,
        type: dto.type,
        notes: dto.notes || null,
        date: dto.date ? new Date(dto.date) : new Date(),
        clientPhone: dto.clientPhone ?? null,
        status: ServiceStatus.DRAFT,
        tech: { connect: { id: techId } },
        client: { connect: { id: clientId } },
        ...(siteId ? { site: { connect: { id: siteId } } } : {}),
      },
      include: { client: true, site: true, tech: true }
    })
  }

  // 2. SUBIR ARCHIVO (multipart)
  async uploadFile(
    id: string,
    file: Express.Multer.File,
    kind: FileKind,
    user: { userId: string; role: string },
  ) {
    const s = await this.prisma.service.findUnique({ where: { id } })
    if (!s) throw new NotFoundException('Servicio no encontrado')

    const ext = file.originalname.split('.').pop() || 'png'
    const key = `services/${id}/${Date.now()}-${kind}.${ext}`

    const { url } = await this.storage.uploadBuffer(key, file.buffer, file.mimetype)

    const created = await this.prisma.serviceFile.create({
      data: {
        serviceId: id,
        kind,
        url,
        meta: { size: file.size, type: file.mimetype, key },
      },
    })

    this.logger.log(`ServiceFile creado (multipart): id=${created.id} kind=${created.kind} url=${created.url}`)
    return created
  }

  // 2b. SUBIR DESDE DATA URI (p.ej. firma enviada como dataURL)
  async uploadFileFromDataUrl(
    id: string,
    dataUrl: string,
    kind: FileKind,
    user: { userId: string; role: string },
  ) {
    const s = await this.prisma.service.findUnique({ where: { id } })
    if (!s) throw new NotFoundException('Servicio no encontrado')

    const match = typeof dataUrl === 'string' && dataUrl.match(/^data:(.+);base64,(.*)$/)
    if (!match) {
      this.logger.warn('uploadFileFromDataUrl: formato inválido, intentando interpretar como base64 crudo')
      try {
        const buffer = Buffer.from(dataUrl, 'base64')
        const key = `services/${id}/${Date.now()}-SIGNATURE.png`
        const { url } = await this.storage.uploadBuffer(key, buffer, 'image/png')
        const created = await this.prisma.serviceFile.create({
          data: { serviceId: id, kind, url, meta: { size: buffer.length, type: 'image/png', key } },
        })
        this.logger.log(`ServiceFile creado (from base64 crudo): id=${created.id} url=${created.url}`)
        return created
      } catch (err) {
        throw new BadRequestException('signatureDataUrl inválido o corrupto')
      }
    }

    const contentType = match[1]
    const b64 = match[2]
    const buffer = Buffer.from(b64, 'base64')
    let ext = 'png'
    if (contentType.includes('jpeg') || contentType.includes('jpg')) ext = 'jpg'
    else if (contentType.includes('svg')) ext = 'svg'
    else if (contentType.includes('png')) ext = 'png'

    const key = `services/${id}/${Date.now()}-SIGNATURE.${ext}`
    const { url } = await this.storage.uploadBuffer(key, buffer, contentType)

    const created = await this.prisma.serviceFile.create({
      data: {
        serviceId: id,
        kind,
        url,
        meta: { size: buffer.length, type: contentType, key },
      },
    })

    this.logger.log(`ServiceFile creado (dataUrl): id=${created.id} kind=${created.kind} url=${created.url}`)
    return created
  }

  // 3. FIRMAR Y ENVIAR
  async signAndSend(
    id: string,
    dto: UpdateServiceDto,
    user: { userId: string; role: string },
  ) {
    const service = await this.prisma.service.findUnique({
      where: { id },
      include: { client: true, site: true, tech: true, files: true },
    })

    if (!service) throw new NotFoundException('Servicio no encontrado')

    const fotos = service.files.filter(f => f.kind === FileKind.PHOTO).map(f => f.url)
    const firma = service.files.find(f => f.kind === FileKind.SIGNATURE)?.url

    const fecha = service.date ? new Date(service.date).toLocaleString() : new Date().toLocaleString()
    const generatedAt = new Date().toLocaleString()

    const datosPdf = {
      nombreCliente: service.client?.name ?? '',
      sitio: service.site?.name ?? '',
      correo: service.client?.email ?? '',
      telefono: dto.clientPhone ?? service.clientPhone ?? '',
      tecnico: service.tech?.name ?? '',
      detalles: dto.notes ?? service.notes ?? '',
      fotos,
      firma: firma || '',
      serviceUid: service.serviceUid,
      fecha,
      generatedAt,
      logoUrl: process.env.PDF_LOGO_URL || '',
    }

    this.logger.log(`Generando PDF para ${service.serviceUid}...`)
    
    const pdfBuffer = await this.pdfService.generarPDFServiceDetail(datosPdf)

    const attachments: Attachment[] = [
      {
        filename: `Reporte_${service.serviceUid}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf',
      },
    ]

    const recipients = [
      service.client?.email,
      ...(dto.clientEmails || [])
    ].filter((email): email is string => !!email)

    if (recipients.length > 0) {
      await this.mail.sendServiceReport({
        to: recipients,
        subject: `Reporte de Servicio: ${service.serviceUid}`,
        html: `
          <h3>Servicio Finalizado</h3>
          <p>Estimado cliente,</p>
          <p>Adjunto encontrará el reporte técnico del servicio realizado en <strong>${service.site?.name || 'su ubicación'}</strong>.</p>
          <p>Atentamente,<br><strong>Equipo Reporta+</strong></p>
        `,
        attachments,
      })
    }

    await this.prisma.report.create({
      data: {
        serviceId: service.id,
        sentTo: recipients,
        sentAt: new Date(),
      },
    })

    return this.prisma.service.update({
      where: { id },
      data: {
        status: ServiceStatus.SENT,
        version: { increment: 1 },
        notes: dto.notes ?? service.notes,
      },
    })
  }

  // STANDARD: findMany/getOne etc.
  async findMany(query: any, user: { userId: string; role: string }) {
    const { q, from, to, tech, client, status, page, pageSize } = query
    const where: any = {}

    if (q) {
      where.OR = [
        { serviceUid: { contains: q, mode: 'insensitive' } },
        { client: { name: { contains: q, mode: 'insensitive' } } },
      ]
    }
    if (user.role === 'TECH') where.techId = user.userId

    const p = Number(page || 1)
    const ps = Number(pageSize || 20)

    const [items, total] = await Promise.all([
      this.prisma.service.findMany({
        where,
        orderBy: { date: 'desc' },
        skip: (p - 1) * ps,
        take: ps,
        include: { client: true, site: true, tech: true, files: true },
      }),
      this.prisma.service.count({ where }),
    ])

    return { items, total, page: p, pageSize: ps }
  }

  async getOne(id: string, user: { userId: string; role: string }) {
    const s = await this.prisma.service.findUnique({
      where: { id },
      include: { client: true, site: true, tech: true, files: true },
    })
    if (!s) throw new NotFoundException()
    return s
  }

  // UPDATED: handle client/site nested changes safely (fix Prisma unknown-field errors)
  async update(id: string, dto: UpdateServiceDto, user: any) {
    // Fetch existing service with relations
    const service = await this.prisma.service.findUnique({
      where: { id },
      include: { client: true, site: true },
    })
    if (!service) throw new NotFoundException('Servicio no encontrado')

    // We'll collect the update payload for the service (only fields that exist on Service model)
    const updateData: any = {}

    if (dto.type !== undefined) updateData.type = dto.type
    if (dto.notes !== undefined) updateData.notes = dto.notes
    if (dto.clientPhone !== undefined) updateData.clientPhone = dto.clientPhone
    // date/status/version etc can be handled here as needed

    // --- CLIENT handling ---
    // If client fields provided, either update existing client or create & connect a new one
    if (dto.clientName || dto.clientEmail || dto.clientPhone) {
      if (service.client) {
        // Update the existing client record directly
        const clientUpdate: any = {}
        if (dto.clientName) clientUpdate.name = dto.clientName
        if (dto.clientEmail) clientUpdate.email = dto.clientEmail
        if (dto.clientPhone) clientUpdate.phone = dto.clientPhone
        await this.prisma.client.update({ where: { id: service.client.id }, data: clientUpdate })
      } else {
        // create a new client and connect
        const newClient = await this.prisma.client.create({
          data: {
            name: dto.clientName || 'Cliente',
            email: dto.clientEmail ?? null,
            phone: dto.clientPhone ?? null,
          },
        })
        updateData.client = { connect: { id: newClient.id } }
      }
    }

    // --- SITE handling ---
    // If site fields provided, update existing or create attached to client
    if (dto.siteName || dto.siteAddress) {
      if (service.site) {
        const siteUpdate: any = {}
        if (dto.siteName) siteUpdate.name = dto.siteName
        if (dto.siteAddress) siteUpdate.address = dto.siteAddress
        await this.prisma.site.update({ where: { id: service.site.id }, data: siteUpdate })
      } else {
        // Need a client to attach the site to: prefer existing client or one created above
        let clientIdToUse = service.client?.id
        if (!clientIdToUse) {
          // maybe we just created one via updateData.client.connect
          if (updateData.client && updateData.client.connect) clientIdToUse = updateData.client.connect.id
          else {
            // no client info present: create a placeholder client if minimal info exists
            const newClient = await this.prisma.client.create({
              data: {
                name: dto.clientName ?? 'Cliente',
                email: dto.clientEmail ?? null,
                phone: dto.clientPhone ?? null,
              },
            })
            clientIdToUse = newClient.id
            updateData.client = { connect: { id: clientIdToUse } }
          }
        }
        const newSite = await this.prisma.site.create({
          data: {
            name: dto.siteName ?? '',
            address: dto.siteAddress ?? null,
            clientId: clientIdToUse,
          },
        })
        updateData.site = { connect: { id: newSite.id } }
      }
    }

    // If DTO explicitly contains clientId or siteId to connect, handle that
    if (dto.clientId) updateData.client = { connect: { id: dto.clientId } }
    if (dto.siteId) updateData.site = { connect: { id: dto.siteId } }

    // Finally perform the service update
    return this.prisma.service.update({
      where: { id },
      data: updateData,
    })
  }

  async remove(id: string, user: any) {
    await this.prisma.serviceFile.deleteMany({ where: { serviceId: id } })
    await this.prisma.report.deleteMany({ where: { serviceId: id } })
    await this.prisma.service.delete({ where: { id } })
    return { ok: true }
  }
}