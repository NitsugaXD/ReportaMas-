import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common'
import { ServicesService } from './services.service'
import { CreateServiceDto, UpdateServiceDto } from './dto/create-service.dto'
import { QueryServiceDto } from './dto/query-service.dto'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { User } from '../common/decorators/user.decorator'

@UseGuards(JwtAuthGuard)
@Controller('services')
export class ServicesController {
  constructor(private readonly svc: ServicesService) {}

  @Post()
  create(@Body() dto: CreateServiceDto, @User() user: any) {
    return this.svc.create(dto, user)
  }

  @Get()
  list(@Query() q: QueryServiceDto, @User() user: any) {
    return this.svc.findMany(q, user)
  }

  @Get(':id')
  getOne(@Param('id') id: string, @User() user: any) {
    return this.svc.getOne(id, user)
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateServiceDto, @User() user: any) {
    return this.svc.update(id, dto, user)
  }
}