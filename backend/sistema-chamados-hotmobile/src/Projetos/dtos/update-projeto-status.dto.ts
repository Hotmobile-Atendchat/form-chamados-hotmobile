import { IsOptional, IsString } from 'class-validator';

export class UpdateProjetoStatusDto {
  @IsString()
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  responsavel?: string;

  @IsString()
  @IsOptional()
  responsavelCor?: string;
}
