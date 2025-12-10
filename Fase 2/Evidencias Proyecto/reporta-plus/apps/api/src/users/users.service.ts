import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateUserDto } from './dto/create-user.dto'
import { UpdateUserDto } from './dto/update-user.dto'
import * as bcrypt from 'bcrypt'

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateUserDto) {
    const exists = await this.prisma.user.findUnique({ where: { email: dto.email } })
    if (exists) throw new BadRequestException('Email ya registrado')

    const hashed = await bcrypt.hash(dto.password, 10)
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        name: dto.name,
        role: dto.role,
        password: hashed,
        active: dto.active ?? true,
      },
      select: { id: true, email: true, name: true, role: true, active: true, createdAt: true },
    })
    return user
  }

  async findMany(params: { page?: number; pageSize?: number; role?: string; active?: boolean } = {}) {
    const { page = 1, pageSize = 50, role, active } = params
    const where: any = {}
    if (role) where.role = role
    if (typeof active === 'boolean') where.active = active

    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: { id: true, email: true, name: true, role: true, active: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ])
    return { items, total, page, pageSize }
  }

  async findOne(id: string) {
    const u = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, name: true, role: true, active: true, createdAt: true },
    })
    if (!u) throw new NotFoundException('Usuario no encontrado')
    return u
  }

  async update(id: string, dto: UpdateUserDto) {
    const data: any = {}
    if (dto.email !== undefined) data.email = dto.email
    if (dto.name !== undefined) data.name = dto.name
    if (dto.role !== undefined) data.role = dto.role
    if (typeof dto.active === 'boolean') data.active = dto.active
    if (dto.password) data.password = await bcrypt.hash(dto.password, 10)

    const updated = await this.prisma.user.update({
      where: { id },
      data,
      select: { id: true, email: true, name: true, role: true, active: true, updatedAt: true },
    })
    return updated
  }

  async remove(id: string) {
    await this.prisma.user.delete({ where: { id } })
    return { ok: true }
  }
}