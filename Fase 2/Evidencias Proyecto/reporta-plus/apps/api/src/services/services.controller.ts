import {
  Body,
  Controller,
  Get,
  Delete,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
  Logger,
} from '@nestjs/common'
import { ServicesService } from './services.service'
import { CreateServiceDto, UpdateServiceDto } from './dto/create-service.dto'
import { QueryServiceDto } from './dto/query-service.dto'
import { User } from '../common/decorators/user.decorator'
import { FileInterceptor } from '@nestjs/platform-express'
import { FileKind } from '@prisma/client'
import multer from 'multer' // Importante para tipos

@Controller('services')
export class ServicesController {
  private readonly logger = new Logger(ServicesController.name)

  constructor(private readonly svc: ServicesService) {}

  @Post()
  create(@Body() dto: CreateServiceDto, @User() user: any) {
    this.logger.log(`Creando servicio para cliente: ${dto.clientName}`)
    return this.svc.create(dto, user)
  }

  @Get()
  list(@Query() q: QueryServiceDto, @User() user: any) {
    return this.svc.findMany(
      {
        q: q.q,
        from: q.from,
        to: q.to,
        tech: q.tech,
        client: q.client,
        status: q.status,
        page: Number(q.page ?? 1),
        pageSize: Number(q.pageSize ?? 20),
      },
      user,
    )
  }

  @Get(':id')
  getOne(@Param('id') id: string, @User() user: any) {
    return this.svc.getOne(id, user)
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateServiceDto, @User() user: any) {
    return this.svc.update(id, dto, user)
  }

  @Patch(':id/sign-and-send')
  signAndSend(@Param('id') id: string, @Body() dto: UpdateServiceDto, @User() user: any) {
    this.logger.log(`Firmando y enviando servicio ${id}`)
    return this.svc.signAndSend(id, dto, user)
  }

  // Upload endpoint: acepta multipart file (campo "file") O un signatureDataUrl en body
  @Post(':id/files')
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Query('kind') kind: string | undefined,
    @Body() body: any,
    @User() user: any,
  ) {
    // 1. Si recibimos dataURL en body (por ejemplo signatureDataUrl), lo tratamos
    const signatureDataUrl = body?.signatureDataUrl || body?.signature || body?.signature_base64
    if (!file && signatureDataUrl) {
      this.logger.log(`Recibido signatureDataUrl en body - subiendo como SIGNATURE`)
      // asegurar que el kind quede SIGNATURE
      return this.svc.uploadFileFromDataUrl(id, signatureDataUrl, FileKind.SIGNATURE, user)
    }

    // 2. Si recibimos archivo multipart, procesarlo normalmente
    if (!file) {
      this.logger.warn(`No se recibió archivo ni signatureDataUrl para service ${id}`)
      throw new Error('Archivo o signatureDataUrl requerido')
    }

    this.logger.log(`Subiendo archivo multipart: ${kind ?? 'no-kind'} - Tamaño: ${file?.size}`)

    // 3. Mapeo seguro de String -> Enum (por query param)
    let kindEnum: FileKind = FileKind.PHOTO
    const k = (kind || '').toUpperCase()
    if (k === 'SIGNATURE') kindEnum = FileKind.SIGNATURE
    if (k === 'PDF') kindEnum = FileKind.PDF
    if (k === 'XLSX') kindEnum = FileKind.XLSX

    return this.svc.uploadFile(id, file, kindEnum, user)
  }

  @Delete(':id')
  remove(@Param('id') id: string, @User() user: any) {
    return this.svc.remove(id, user)
  }
}