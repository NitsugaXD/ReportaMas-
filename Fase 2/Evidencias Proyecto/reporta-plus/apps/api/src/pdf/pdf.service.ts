import { Injectable, Logger } from '@nestjs/common'
import * as fs from 'fs'
import * as fsPromises from 'fs/promises'
import * as path from 'path'
import * as puppeteer from 'puppeteer'

@Injectable()
export class PdfService {
  private readonly logger = new Logger(PdfService.name)

  // Método helper para encontrar la plantilla donde sea que esté
  private getTemplatePath(templateName: string): string {
    const possiblePaths = [
      // 1. Donde debería estar en producción (dist/src/pdf/templates)
      path.join(__dirname, 'templates', templateName),
      // 2. Si la estructura se aplanó (dist/pdf/templates)
      path.join(__dirname, '..', 'templates', templateName),
      // 3. Directo en el código fuente (para desarrollo local)
      path.join(process.cwd(), 'src', 'pdf', 'templates', templateName),
      // 4. Intento desde la raíz de la app
      path.join(process.cwd(), 'apps', 'api', 'src', 'pdf', 'templates', templateName),
    ];

    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        this.logger.log(`Plantilla encontrada en: ${p}`);
        return p;
      }
    }

    throw new Error(`No se encontró la plantilla ${templateName} en ninguna ruta esperada.`);
  }

  // Helper sencillo: cargar plantilla y reemplazar placeholders {{key}}
  private async renderTemplate(templateName: string, replacements: Record<string, string>) {
    const plantillaPath = this.getTemplatePath(templateName)
    let html = await fsPromises.readFile(plantillaPath, 'utf8')
    for (const k of Object.keys(replacements)) {
      const v = replacements[k] ?? ''
      html = html.split(`{{${k}}}`).join(v)
    }
    return html
  }

  // Generador de PDF para Service Detail (usa plantilla service-detail.html)
  async generarPDFServiceDetail(datos: {
    nombreCliente: string,
    sitio: string,
    correo: string,
    telefono: string,
    tecnico: string,
    detalles: string,
    fotos: string[],   // URLs
    firma: string,     // URL o vacío
    serviceUid?: string,
    fecha?: string,
    generatedAt?: string,
    logoUrl?: string,
  }): Promise<Buffer> {
    const fotoHtml = (datos.fotos ?? []).map(f => `<img src="${f}" class="photo" />`).join('')
    const firmaHtml = datos.firma ? `<img src="${datos.firma}" />` : ''

    const replacements: Record<string, string> = {
      nombreCliente: datos.nombreCliente || '',
      sitio: datos.sitio || '',
      correo: datos.correo || '',
      telefono: datos.telefono || '',
      tecnico: datos.tecnico || '',
      detalles: datos.detalles || '',
      fotos: fotoHtml,
      firma: firmaHtml,
      serviceUid: datos.serviceUid || '',
      fecha: datos.fecha || '',
      generatedAt: datos.generatedAt || new Date().toLocaleString(),
      logoUrl: datos.logoUrl || process.env.PDF_LOGO_URL || '',
    }

    const html = await this.renderTemplate('service-detail.html', replacements)

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })

    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'networkidle0' })

    const pdfUint8 = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20px', bottom: '20px', left: '20px', right: '20px' },
    })

    await browser.close()
    return Buffer.from(pdfUint8)
  }

  async generarPDF(datos: any): Promise<Buffer> {
    try {
      return await this.generarPDFServiceDetail(datos)
    } catch (err) {
      this.logger.error('Error en generarPDF alias: ' + (err as any)?.message)
      throw err
    }
  }
}