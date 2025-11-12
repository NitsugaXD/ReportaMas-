import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common'
import { ClientsService } from './clients.service'
import { CreateClientDto } from './dto/create-client.dto'
import { UpdateClientDto } from './dto/update-client.dto'
import { CreateSiteDto } from './dto/create-site.dto'
import { UpdateSiteDto } from './dto/update-site.dto'
import { Roles } from '../common/decorators/roles.decorator'

@Controller('clients')
export class ClientsController {
  constructor(private readonly svc: ClientsService) {}

  @Get()
  list(@Query('q') q?: string, @Query('page') page = '1', @Query('pageSize') pageSize = '20') {
    return this.svc.searchClients(q, Number(page), Number(pageSize))
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.svc.getClient(id)
  }

  @Roles('SUP','ADMIN')
  @Post()
  create(@Body() dto: CreateClientDto) {
    return this.svc.createClient(dto)
  }

  @Roles('SUP','ADMIN')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateClientDto) {
    return this.svc.updateClient(id, dto)
  }

  @Roles('SUP','ADMIN')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.svc.deleteClient(id)
  }

  @Get(':id/sites')
  listSites(@Param('id') clientId: string) {
    return this.svc.listSites(clientId)
  }

  @Roles('SUP','ADMIN')
  @Post(':id/sites')
  createSite(@Param('id') clientId: string, @Body() dto: CreateSiteDto) {
    return this.svc.createSite(clientId, dto)
  }

  @Roles('SUP','ADMIN')
  @Patch(':id/sites/:siteId')
  updateSite(@Param('id') clientId: string, @Param('siteId') siteId: string, @Body() dto: UpdateSiteDto) {
    return this.svc.updateSite(clientId, siteId, dto)
  }

  @Roles('SUP','ADMIN')
  @Delete(':id/sites/:siteId')
  deleteSite(@Param('id') clientId: string, @Param('siteId') siteId: string) {
    return this.svc.deleteSite(clientId, siteId)
  }
}