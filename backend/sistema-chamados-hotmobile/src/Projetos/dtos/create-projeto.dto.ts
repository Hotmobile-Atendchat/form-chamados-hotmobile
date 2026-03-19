import { IsArray, IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateProjetoDto {
  @IsString()
  @IsNotEmpty()
  nome: string;

  @IsString()
  @IsNotEmpty()
  tipoProjeto: string;

  @IsString()
  @IsOptional()
  descricao?: string;

  @Transform(({ value }) => {
    if (typeof value === 'string') return [value];
    return value;
  })
  @IsArray()
  @IsEmail({}, { each: true })
  @IsOptional()
  emails?: string[];

  @Transform(({ value }) => {
    if (typeof value === 'string') return [value];
    return value;
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  telefones?: string[];
}
