import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator'

export class CreateClientDto {
  @IsString() @MinLength(2) name: string
  @IsOptional() @IsString() rut?: string
  @IsOptional() @IsString() contact?: string
  @IsOptional() @IsEmail() email?: string
  @IsOptional() @IsString() phone?: string
}
