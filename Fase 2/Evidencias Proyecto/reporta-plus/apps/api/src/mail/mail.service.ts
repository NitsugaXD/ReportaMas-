import { Injectable, Logger } from '@nestjs/common'
import * as nodemailer from 'nodemailer'

interface SendServiceReportParams {
  to: string[]
  subject: string
  html: string
  attachments?: { filename: string; path: string }[]
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name)
  private transporter: nodemailer.Transporter

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    console.log('[MAIL] Config:', process.env.SMTP_HOST, process.env.SMTP_PORT, process.env.SMTP_USER)
  }

  async sendServiceReport(params: SendServiceReportParams): Promise<void> {
    const { to, subject, html, attachments } = params

    if (!to.length) {
      this.logger.warn('sendServiceReport llamado sin destinatarios')
      return
    }

    try {
      await this.transporter.sendMail({
        from: process.env.MAIL_FROM ?? process.env.SMTP_USER,
        to,
        subject,
        html,
        attachments,
      })
      this.logger.log(`Correo de servicio enviado a: ${to.join(', ')}`)
    } catch (error) {
      this.logger.error('Error enviando correo de servicio', error as any)
    }
  }
}
