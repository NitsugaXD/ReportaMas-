import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator'
import { RoleDto } from './create-user.dto'

export class UpdateUserDto {
  @IsOptional() @IsString() name?: string
  @IsOptional() @IsEmail() email?: string
  @IsOptional() @IsEnum(RoleDto) role?: RoleDto
  @IsOptional() @IsString() @MinLength(6) password?: string
  @IsOptional() active?: boolean
}