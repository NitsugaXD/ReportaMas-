import { IsDateString, IsEnum, IsOptional, IsString, MinLength } from 'class-validator'

export class CreateServiceDto {
  @IsString() @MinLength(6) serviceUid: string
  @IsString() techId: string
  @IsString() clientId: string
  @IsOptional() @IsString() siteId?: string
  @IsString() type: string
  @IsOptional() @IsString() notes?: string
  @IsOptional() @IsDateString() date?: string
}

export enum ServiceStatusDto {
  DRAFT = 'DRAFT',
  SIGNED = 'SIGNED',
  SENT = 'SENT',
  DONE = 'DONE',
}

export class UpdateServiceDto {
  @IsOptional() @IsString() type?: string
  @IsOptional() @IsString() notes?: string
  @IsOptional() @IsEnum(ServiceStatusDto) status?: ServiceStatusDto
  @IsOptional() version?: number // control de versión
}