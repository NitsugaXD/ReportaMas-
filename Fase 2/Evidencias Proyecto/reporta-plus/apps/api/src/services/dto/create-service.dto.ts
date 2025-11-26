import { IsArray, IsDateString, IsEnum, IsOptional, IsString, MinLength, IsEmail } from 'class-validator'

export class CreateServiceDto {
  serviceUid: string
  techId?: string

  clientId?: string
  clientName?: string

  @IsOptional()
  @IsEmail()
  clientEmail?: string

  siteId?: string
  siteName?: string
  siteAddress?: string

  type: string
  notes?: string
  date?: string
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

  @IsArray()
  @IsEmail({}, { each: true })
  @IsOptional()
  clientEmails?: string[]

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  clientPhones?: string[]
}
