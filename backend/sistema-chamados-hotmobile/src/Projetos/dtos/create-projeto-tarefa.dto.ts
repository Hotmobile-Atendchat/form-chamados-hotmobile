import { IsInt, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProjetoTarefaDto {
  @IsString()
  titulo: string;

  @IsString()
  @IsOptional()
  descricao?: string;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  sprintId?: number;

  @IsString()
  @IsOptional()
  responsavel?: string;

  @IsString()
  @IsOptional()
  responsavelCor?: string;
}
