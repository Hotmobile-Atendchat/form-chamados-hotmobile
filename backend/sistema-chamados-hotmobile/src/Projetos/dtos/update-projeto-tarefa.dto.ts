import { IsIn, IsOptional, IsString } from 'class-validator';

export class UpdateProjetoTarefaDto {
  @IsString()
  @IsOptional()
  titulo?: string;

  @IsString()
  @IsOptional()
  descricao?: string;

  @IsString()
  @IsOptional()
  sprint?: string;

  @IsString()
  @IsIn(['PENDENTE', 'EM_ANDAMENTO', 'CONCLUIDA'])
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  responsavel?: string;

  @IsString()
  @IsOptional()
  responsavelCor?: string;
}
