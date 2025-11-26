import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { PrismaModule } from './prisma/prisma.module'
import { AuthModule } from './auth/auth.module'
import { ClientsModule } from './clients/clients.module'
import { ServicesModule } from './services/services.module'
import { StorageModule } from './storage/storage.module'
import { APP_GUARD } from '@nestjs/core'
import { JwtAuthGuard } from './common/guards/jwt-auth.guard'
import { RolesGuard } from './common/guards/roles.guard'
import { HealthController } from './health.controller'
import { MailModule } from './mail/mail.module'
import { AppController } from './app.controller'
import { AppService } from './app.service'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    StorageModule,
    AuthModule,
    ClientsModule,
    MailModule,
    ServicesModule,
  ],
  controllers: [
    HealthController,
    AppController,],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    AppService
  ],
})
export class AppModule {}