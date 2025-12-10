import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  ForbiddenException,
} from '@nestjs/common'
import { UsersService } from './users.service'
import { CreateUserDto } from './dto/create-user.dto'
import { UpdateUserDto } from './dto/update-user.dto'
import { User } from '../common/decorators/user.decorator'

@Controller('users')
export class UsersController {
  constructor(private readonly svc: UsersService) {}

  private ensureSupervisor(user: any) {
    if (!user) throw new ForbiddenException('No autorizado')
    if (user.role !== 'SUP' && user.role !== 'ADMIN') throw new ForbiddenException('Permiso requerido: supervisor')
  }

  @Post()
  async create(@Body() dto: CreateUserDto, @User() user: any) {
    this.ensureSupervisor(user)
    return this.svc.create(dto)
  }

  @Get()
  async list(@Query('page') page = '1', @Query('pageSize') pageSize = '50', @Query('role') role?: string, @Query('active') active?: string, @User() user?: any) {
    this.ensureSupervisor(user)
    const res = await this.svc.findMany({ page: Number(page), pageSize: Number(pageSize), role, active: active === undefined ? undefined : active === 'true' })
    return res
  }

  @Get(':id')
  async getOne(@Param('id') id: string, @User() user: any) {
    this.ensureSupervisor(user)
    return this.svc.findOne(id)
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateUserDto, @User() user: any) {
    this.ensureSupervisor(user)
    return this.svc.update(id, dto)
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @User() user: any) {
    this.ensureSupervisor(user)
    this.ensureSupervisor(user)
    return this.svc.remove(id)
  }
}