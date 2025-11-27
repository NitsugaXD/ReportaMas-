import { Controller, Post, Body } from '@nestjs/common';
import { ReportesService } from './reportes.service';

@Controller('reportes')
export class ReportesController {
  constructor(private readonly reportesService: ReportesService) {}

  @Post()
  async crearReporte(@Body() datos: any) {
    await this.reportesService.generarYEnviar(datos);
    return { status: 'ok' };
  }
}