import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// Importação do Mailchimp Transactional
const mailchimpFactory = require('@mailchimp/mailchimp_transactional');

@Injectable()
export class MailService implements OnModuleInit {
  private readonly logger = new Logger(MailService.name);
  private mailchimp: any;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    try {
      const apiKey = this.configService.get<string>('MAILCHIMP_API_KEY');
      this.mailchimp = mailchimpFactory(apiKey);

      // Validação da conexão
      const response = await this.mailchimp.users.ping();
      this.logger.log(`🚀 Mailchimp Transactional pronto: ${response}`);
    } catch (error) {
      this.logger.error('❌ Falha ao conectar no Mailchimp. Verifique a MAILCHIMP_API_KEY.');
    }
  }

  // --- MÉTODOS PÚBLICOS (Mantendo a compatibilidade com seu código anterior) ---

  async enviarAvisoInicioAtendimento(emailDestino: string, nomeEmpresa: string, linkAcompanhamento: string) {
    const corpoHtml = `
        <div style="font-family: Arial, sans-serif; color: #333; padding: 20px;">
          <h2 style="color: #1976d2;">Olá, ${nomeEmpresa}!</h2>
          <p>Temos boas notícias. Um de nossos técnicos iniciou o atendimento.</p>
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
    return this.enviarEmailBase(emailDestino, '🚀 Seu chamado iniciou o atendimento!', corpoHtml);
  }

  async enviarNotificacaoGenerica(emailDestino: string, assunto: string, mensagem: string, linkAcao?: string) {
    const corpoHtml = `
      <div style="font-family: Arial, sans-serif; color: #333; padding: 20px;">
        <h2 style="color: #2e7d32;">Atualização do Chamado</h2>
        <p style="font-size: 16px;">${mensagem}</p>
        
        ${linkAcao ? `
        <div style="margin: 25px 0;">
          <a href="${linkAcao}" style="background-color: #2e7d32; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
            Ver Chamado
          </a>
        </div>
        <p style="font-size: 12px; color: #666;">Link: ${linkAcao}</p>
        ` : ''}
        
        <hr>
        <p>Atenciosamente,<br><strong>Equipe Hotmobile</strong></p>
      </div>
    `;

    return this.enviarEmailBase(emailDestino, assunto, corpoHtml);
  }

  // --- MÉTODO PRIVADO DE DISPARO (AGORA VIA MAILCHIMP) ---
  private async enviarEmailBase(emailDestino: string, assunto: string, html: string) {
    try {
      this.logger.debug(`📧 Enviando via Mailchimp para: ${emailDestino}`);

      const response = await this.mailchimp.messages.send({
        message: {
          from_email: "caique.menezes@hotmobile.com.br", // Seu e-mail verificado no Mailchimp
          from_name: "Suporte Hotmobile",
          subject: assunto,
          html: html,
          to: [
            {
              email: emailDestino,
              type: 'to',
            },
          ],
        },
      });

      this.logger.log(`✅ Email enviado com sucesso via Mailchimp!`);
      return response;

    } catch (error) {
      this.logger.error(`❌ Erro ao disparar email via Mailchimp: ${error.message}`);
      throw error;
    }
  }
}