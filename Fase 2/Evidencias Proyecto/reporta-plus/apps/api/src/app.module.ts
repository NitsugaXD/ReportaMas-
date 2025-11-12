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

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    StorageModule,
    AuthModule,
    ClientsModule,
    ServicesModule,
  ],
  providers: [
    // 1) Primero se autentica (pone el usuario en request)
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    // 2) Luego se autorizan las rutas segun roles
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}