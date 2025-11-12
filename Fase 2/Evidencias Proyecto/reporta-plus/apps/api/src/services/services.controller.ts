import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common'
import { ServicesService } from './services.service'
import { CreateServiceDto, UpdateServiceDto } from './dto/create-service.dto'
import { QueryServiceDto } from './dto/query-service.dto'
import { User } from '../common/decorators/user.decorator'
import { FileInterceptor } from '@nestjs/platform-express'
import multer from 'multer'

@Controller('services')
export class ServicesController {
  constructor(private readonly svc: ServicesService) {}

  @Post()
  create(@Body() dto: CreateServiceDto, @User() user: any) {
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

  @Post(':id/files')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: multer.memoryStorage(),
      limits: { fileSize: 20 * 1024 * 1024 },
    }),
  )
  upload(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Query('kind') kind: 'PHOTO' | 'SIGNATURE' | 'PDF' | 'XLSX',
    @User() user: any,
  ) {
    if (!file) throw new Error('Archivo requerido')
    return this.svc.uploadFile(id, file, (kind ?? 'PHOTO') as any, user)
  }
}