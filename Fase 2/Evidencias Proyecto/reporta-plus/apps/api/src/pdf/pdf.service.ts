import { Injectable } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as puppeteer from 'puppeteer';

@Injectable()
export class PdfService {
  async generarPDF(datos: {
    nombreCliente: string,
    correo: string,
    direccion: string,
    detalles: string,
    fotos: string[], // BASE64 o URLs
    firma: string, // BASE64 o URL
    archivosAdjuntos?: string[] // Nombres o URLs
  }): Promise<Buffer> {
    const plantillaPath = path.join(__dirname, 'templates', 'trabajo.html');
    let html = await fs.readFile(plantillaPath, 'utf8');

    html = html
      .replace('{{nombreCliente}}', datos.nombreCliente)
      .replace('{{correo}}', datos.correo)
      .replace('{{direccion}}', datos.direccion)
      .replace('{{detalles}}', datos.detalles)
      .replace('{{firma}}', datos.firma)
      .replace('{{fotos}}', datos.fotos.map(f => `<img src="${f}" class="photo"/>`).join(''));

    if (html.includes('{{archivosAdjuntos}}') && datos.archivosAdjuntos && datos.archivosAdjuntos.length > 0) {
      html = html.replace('{{archivosAdjuntos}}', datos.archivosAdjuntos.map(a => `<li>${a}</li>`).join(''));
      html = html.replace('{{#if archivosAdjuntos}}', '').replace('{{/if}}', '');
    } else {
      const regexBloque = /\{\{#if archivosAdjuntos\}\}(.|\n)*\{\{\/if\}\}/g;
      html = html.replace(regexBloque, '');
    }

    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({ format: 'A4' });
    await browser.close();

    return Buffer.from(pdfBuffer);
  }

  // NUEVO - PDF para ServiceDetail
  async generarPDFServiceDetail(datos: {
    nombreCliente: string,
    sitio: string,
    correo: string,
    telefono: string,
    tecnico: string,
    detalles: string,
    fotos: string[], // URLs o base64
    firma: string // URL o base64
  }): Promise<Buffer> {
    const plantillaPath = path.join(__dirname, 'templates', 'service-detail.html');
    let html = await fs.readFile(plantillaPath, 'utf8');

    html = html
      .replace('{{nombreCliente}}', datos.nombreCliente || '')
      .replace('{{sitio}}', datos.sitio || '')
      .replace('{{correo}}', datos.correo || '')
      .replace('{{telefono}}', datos.telefono || '')
      .replace('{{tecnico}}', datos.tecnico || '')
      .replace('{{detalles}}', datos.detalles || '')
      .replace('{{fotos}}', (datos.fotos ?? []).map(f => `<img src="${f}" class="photo"/>`).join('') || '<i>Sin fotos</i>')
      .replace('{{firma}}', datos.firma ? `<img src="${datos.firma}" class="signature"/>` : '<i>Sin firma</i>');

    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
    await browser.close();
    return Buffer.from(pdfBuffer);
  }
}