import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);

  private apiUrl: string;
  private apiUser: string;
  private apiPass: string;
  private instanciaId: number;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.apiUrl = this.configService.getOrThrow<string>('HOTMOBILE_API_URL');
    this.apiUser = this.configService.getOrThrow<string>('HOTMOBILE_API_USER');
    this.apiPass = this.configService.getOrThrow<string>('HOTMOBILE_API_PASS');
    this.instanciaId = Number(this.configService.getOrThrow<string>('HOTMOBILE_INSTANCIA_ID'));

    if (!this.apiUser || !this.apiPass) {
      this.logger.error('Credenciais da API Hotmobile nao configuradas.');
    }
  }

  async enviarAvisoCriacaoChamado(
    telefone: string,
    nomeEmpresa: string,
    idChamado: number,
    linkAcompanhamento: string,
  ) {
    const mensagemTexto = `Ola *${nomeEmpresa}*!\n\nRecebemos seu chamado *#${idChamado}* com sucesso.\n\nEle ja esta na nossa fila aguardando um atendente.\n\nAcompanhe o status aqui:\n${linkAcompanhamento}`;
    return this.enviarMensagemBase(telefone, mensagemTexto);
  }

  async enviarAvisoInicioAtendimento(
    telefone: string,
    nomeEmpresa: string,
    linkAcompanhamento: string,
  ) {
    const mensagemTexto = `Ola *${nomeEmpresa}*!\n\nSeu chamado no Suporte Hotmobile entrou em *ATENDIMENTO*.\n\nAcompanhe aqui:\n${linkAcompanhamento}`;
    return this.enviarMensagemBase(telefone, mensagemTexto);
  }

  async enviarMensagem(telefone: string, mensagem: string) {
    return this.enviarMensagemBase(telefone, mensagem);
  }

  private async enviarMensagemBase(telefone: string, texto: string) {
    let numeroLimpo = telefone.replace(/\D/g, '');
    if (numeroLimpo.length <= 11) {
      numeroLimpo = `55${numeroLimpo}`;
    }

    const payload = {
      mensagem: texto,
      instanciaId: this.instanciaId,
      listNumeros: [{ numero: numeroLimpo }],
    };

    try {
      this.logger.debug(`Enviando Zap para ${numeroLimpo}...`);

      const response = await firstValueFrom(
        this.httpService.post(this.apiUrl, payload, {
          auth: { username: this.apiUser, password: this.apiPass },
          headers: { 'Content-Type': 'application/json' },
        }),
      );

      const data = response?.data || {};
      if (data?.erro) {
        const motivo = data?.mensagemRetorno || 'Erro desconhecido na API do WhatsApp.';
        throw new Error(motivo);
      }

      this.logger.log(
        `WhatsApp enviado! Status: ${response.status} | MensagemId: ${data?.mensagemId ?? '-'}`,
      );
      return data;
    } catch (error) {
      this.logger.error(`Erro Zap: ${error.message}`, error.response?.data);
      throw error;
    }
  }
}
