import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class CorreoService {
  private transporter = nodemailer.createTransport({
    host: 'localhost', // Cambia si usas Mailhog/Gmail/etc.
    port: 1025,
    secure: false,
    ignoreTLS: true,
  });

  async enviarTrabajoConPDF(datos: any, pdfBuffer: Buffer) {
    await this.transporter.sendMail({
      from: '"App" <no-reply@tuservicio.com>',
      to: datos.correo, // o destinatario supervisor
      subject: 'Informe de trabajo: ' + datos.nombreCliente,
      text: "Adjunto PDF con el detalle del trabajo.",
      attachments: [
        {
          filename: `Trabajo_${datos.nombreCliente}.pdf`,
          content: pdfBuffer,
        }
      ]
    });
  }
}