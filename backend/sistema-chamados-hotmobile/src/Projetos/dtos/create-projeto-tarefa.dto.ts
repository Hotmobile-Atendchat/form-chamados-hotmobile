import { IsOptional, IsString } from 'class-validator';

export class CreateProjetoTarefaDto {
  @IsString()
  titulo: string;

  @IsString()
  @IsOptional()
  descricao?: string;

  @IsString()
  @IsOptional()
  sprint?: string;

  @IsString()
  @IsOptional()
  responsavel?: string;

  @IsString()
  @IsOptional()
  responsavelCor?: string;
}
