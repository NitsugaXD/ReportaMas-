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
      path.join(__dirname, 'templates', templateName),
      path.join(__dirname, '..', 'templates', templateName),
      path.join(process.cwd(), 'src', 'pdf', 'templates', templateName),
      path.join(process.cwd(), 'apps', 'api', 'src', 'pdf', 'templates', templateName),
    ]

    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        this.logger.log(`Plantilla encontrada en: ${p}`)
        return p
      }
    }

    throw new Error(`No se encontró la plantilla ${templateName} en ninguna ruta esperada.`)
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

  // Si logoPath no es URL HTTP, intenta leer el fichero y devolver data URI
  private async resolveLogoUrl(logoPathOrUrl?: string): Promise<string> {
    if (!logoPathOrUrl) return ''
    const trimmed = logoPathOrUrl.trim()
    if (/^https?:\/\//i.test(trimmed)) return trimmed

    const candidate = path.isAbsolute(trimmed) ? trimmed : path.join(process.cwd(), trimmed)
    if (!fs.existsSync(candidate)) {
      const alt = path.join(process.cwd(), 'apps', 'api', 'src', 'pdf', 'templates', trimmed)
      if (fs.existsSync(alt)) {
        const buf = await fsPromises.readFile(alt)
        const mime = this.mimeFromFilename(alt)
        return `data:${mime};base64,${buf.toString('base64')}`
      }
      this.logger.warn(`Logo no encontrado en disco: ${candidate} (dejando valor tal cual)`)
      return trimmed 
    }

    const buffer = await fsPromises.readFile(candidate)
    const mime = this.mimeFromFilename(candidate)
    return `data:${mime};base64,${buffer.toString('base64')}`
  }

  private mimeFromFilename(filename: string) {
    const ext = (path.extname(filename) || '').toLowerCase()
    if (ext === '.png') return 'image/png'
    if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg'
    if (ext === '.svg') return 'image/svg+xml'
    if (ext === '.webp') return 'image/webp'
    return 'application/octet-stream'
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

    const resolvedLogo = await this.resolveLogoUrl(datos.logoUrl || process.env.PDF_LOGO_URL || '')

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
      logoUrl: resolvedLogo || '',
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

  // Compatibilidad: alias si hace falta
  async generarPDF(datos: any): Promise<Buffer> {
    return this.generarPDFServiceDetail(datos)
  }
}