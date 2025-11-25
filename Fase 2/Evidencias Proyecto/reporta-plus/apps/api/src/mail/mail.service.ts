import { Injectable, Logger } from '@nestjs/common'
import * as nodemailer from 'nodemailer'
import type { Service, Client } from '@prisma/client'

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name)

  private readonly transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: Number(process.env.MAIL_PORT ?? 587),
    secure: process.env.MAIL_SECURE === 'true', // true para 465, false para 587
    auth:
      process.env.MAIL_USER && process.env.MAIL_PASS
        ? {
            user: process.env.MAIL_USER,
            pass: process.env.MAIL_PASS,
          }
        : undefined,
  })

  async sendServiceCreatedEmail(
    to: string,
    service: Service & { client: Client },
  ) {
    if (!to) return

    const from = process.env.MAIL_FROM ?? 'no-reply@reporta.plus'

    const subject = `Guía de servicio ${service.serviceUid} - ${service.type}`

    const textLines = [
      service.client.name
        ? `Estimado/a ${service.client.name},`
        : 'Estimado cliente,',
      '',
      'Se ha registrado una nueva guía de servicio en Reporta+.',
      '',
      `Tipo de servicio: ${service.type}`,
      `UID: ${service.serviceUid}`,
      `Fecha: ${service.date.toISOString()}`,
      '',
      service.notes ? `Observaciones:\n${service.notes}` : '',
      '',
      'Este es un mensaje automático, por favor no responder directamente a este correo.',
    ].filter(Boolean)

    try {
      await this.transporter.sendMail({
        from,
        to,
        subject,
        text: textLines.join('\n'),
      })
    } catch (err) {
      this.logger.error(
        `Error enviando correo de servicio ${service.id} a ${to}`,
        (err as Error).stack,
      )
    }
  }
}