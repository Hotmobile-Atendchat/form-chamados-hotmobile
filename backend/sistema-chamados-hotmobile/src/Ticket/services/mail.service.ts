import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const mailchimpFactory = require('@mailchimp/mailchimp_transactional');

@Injectable()
export class MailService implements OnModuleInit {
  private readonly logger = new Logger(MailService.name);
  private mailchimp: any = null;
  private fromEmail = 'no-reply@hotmobile.com.br';
  private fromName = 'Suporte Hotmobile';

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    this.fromEmail = this.configService.get<string>('MAIL_FROM_EMAIL') || this.fromEmail;
    this.fromName = this.configService.get<string>('MAIL_FROM_NAME') || this.fromName;

    const apiKey = this.configService.get<string>('MAILCHIMP_API_KEY');
    if (!apiKey) {
      this.logger.warn('MAILCHIMP_API_KEY nao configurada. Notificacoes por email estao desabilitadas.');
      return;
    }

    try {
      this.mailchimp = mailchimpFactory(apiKey);
      const response = await this.mailchimp.users.ping();
      this.logger.log(`Mailchimp Transactional pronto: ${response}`);
    } catch (error) {
      this.mailchimp = null;
      this.logger.error('Falha ao conectar no Mailchimp. Verifique a MAILCHIMP_API_KEY.');
    }
  }

  async enviarAvisoInicioAtendimento(
    emailDestino: string,
    nomeEmpresa: string,
    linkAcompanhamento: string,
  ) {
    const corpoHtml = `
      <div style="font-family: Arial, sans-serif; color: #333; padding: 20px;">
        <h2 style="color: #1976d2;">Ola, ${nomeEmpresa}!</h2>
        <p>Temos boas noticias. Um de nossos tecnicos iniciou o atendimento.</p>
        <div style="margin: 25px 0;">
          <a href="${linkAcompanhamento}" style="background-color: #1976d2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
            Acompanhar Chamado
          </a>
        </div>
        <p style="font-size: 12px; color: #666;">Link: ${linkAcompanhamento}</p>
        <hr>
        <p>Atenciosamente,<br><strong>Equipe Hotmobile</strong></p>
      </div>
    `;

    return this.enviarEmailBase(emailDestino, 'Seu chamado iniciou o atendimento!', corpoHtml);
  }

  async enviarNotificacaoGenerica(
    emailDestino: string,
    assunto: string,
    mensagem: string,
    linkAcao?: string,
  ) {
    const corpoHtml = `
      <div style="font-family: Arial, sans-serif; color: #333; padding: 20px;">
        <h2 style="color: #2e7d32;">Atualizacao do Chamado</h2>
        <p style="font-size: 16px;">${mensagem}</p>
        ${
          linkAcao
            ? `
          <div style="margin: 25px 0;">
            <a href="${linkAcao}" style="background-color: #2e7d32; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
              Ver Chamado
            </a>
          </div>
          <p style="font-size: 12px; color: #666;">Link: ${linkAcao}</p>
        `
            : ''
        }
        <hr>
        <p>Atenciosamente,<br><strong>Equipe Hotmobile</strong></p>
      </div>
    `;

    return this.enviarEmailBase(emailDestino, assunto, corpoHtml);
  }

  private async enviarEmailBase(emailDestino: string, assunto: string, html: string) {
    if (!this.mailchimp) {
      this.logger.warn(`Email nao enviado para ${emailDestino}: provedor de email nao configurado.`);
      return null;
    }

    try {
      this.logger.debug(`Enviando email para: ${emailDestino}`);

      const response = await this.mailchimp.messages.send({
        message: {
          from_email: this.fromEmail,
          from_name: this.fromName,
          subject: assunto,
          html,
          to: [
            {
              email: emailDestino,
              type: 'to',
            },
          ],
        },
      });

      this.logger.log(`Email enviado com sucesso para ${emailDestino}.`);
      return response;
    } catch (error) {
      this.logger.error(`Erro ao disparar email para ${emailDestino}: ${error.message}`);
      throw error;
    }
  }
}
