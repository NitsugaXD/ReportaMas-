import { IsNumber, IsOptional, IsString, MinLength } from 'class-validator'

export class CreateSiteDto {
  @IsString() @MinLength(2) name: string
  @IsOptional() @IsString() address?: string
  @IsOptional() @IsNumber() lat?: number
  @IsOptional() @IsNumber() lng?: number
}