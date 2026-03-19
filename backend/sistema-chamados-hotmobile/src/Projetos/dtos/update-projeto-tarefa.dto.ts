import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString } from 'class-validator';

export class UpdateProjetoTarefaDto {
  @IsString()
  @IsOptional()
  titulo?: string;

  @IsString()
  @IsOptional()
  descricao?: string;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  sprintId?: number;

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
