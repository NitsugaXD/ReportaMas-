import { Module } from '@nestjs/common'
import { ServicesService } from './services.service'
import { ServicesController } from './services.controller'
import { PrismaModule } from '../prisma/prisma.module'
import { StorageModule } from '../storage/storage.module'

@Module({
  imports: [PrismaModule, StorageModule],
  providers: [ServicesService],
  controllers: [ServicesController],
})
export class ServicesModule {}
