import { IsDateString, IsString } from 'class-validator';

export class CreateProjetoSprintDto {
  @IsString()
  nome: string;

  @IsDateString()
  dataInicio: string;

  @IsDateString()
  dataFim: string;
}
