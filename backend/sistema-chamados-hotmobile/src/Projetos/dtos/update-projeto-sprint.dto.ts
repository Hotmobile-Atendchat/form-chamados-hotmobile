import { IsDateString, IsIn, IsOptional, IsString } from 'class-validator';

export class UpdateProjetoSprintDto {
  @IsString()
  @IsOptional()
  nome?: string;

  @IsDateString()
  @IsOptional()
  dataInicio?: string;

  @IsDateString()
  @IsOptional()
  dataFim?: string;

  @IsString()
  @IsIn(['PLANEJADA', 'ATIVA', 'CONCLUIDA'])
  @IsOptional()
  status?: string;
}
