import { Injectable } from '@nestjs/common';
import { PdfService } from '../pdf/pdf.service';
import { CorreoService } from '../correo/correo.service';

@Injectable()
export class ReportesService {
  constructor(
    private pdfService: PdfService,
    private correoService: CorreoService
  ) {}

  async generarYEnviar(datos: any) {
    // 1. Generar el PDF
    const pdfBuffer = await this.pdfService.generarPDF(datos);
    // 2. Enviar correo con el PDF adjunto
    await this.correoService.enviarTrabajoConPDF(datos, pdfBuffer);

  }
}