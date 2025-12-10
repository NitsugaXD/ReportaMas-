import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator'

export enum RoleDto {
  TECH = 'TECH',
  SUP = 'SUP',
  ADMIN = 'ADMIN',
}

export class CreateUserDto {
  @IsEmail()
  email!: string

  @IsString()
  name!: string

  @IsEnum(RoleDto)
  role!: RoleDto

  @IsString()
  @MinLength(6)
  password!: string

  @IsOptional()
  active?: boolean
}