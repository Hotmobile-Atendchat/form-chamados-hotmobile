import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { CreateProjetoDto } from '../dtos/create-projeto.dto';
import { UpdateProjetoStatusDto } from '../dtos/update-projeto-status.dto';
import { MailService } from 'src/Ticket/services/mail.service';
import { WhatsappService } from 'src/Ticket/services/whatsapp.service';
import * as storageInterface from 'src/Ticket/services/storage.interface';

const STATUS_LABELS: Record<string, string> = {
  NOVO: 'Novo',
  PLANEJAMENTO: 'Planejamento',
  EM_EXECUCAO: 'Em Execução',
  VALIDACAO: 'Validação',
  FINALIZADO: 'Finalizado',
};

@Injectable()
export class ProjetosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
    private readonly whatsappService: WhatsappService,
    @Inject('STORAGE_SERVICE') private readonly storageService: storageInterface.IStorageService,
  ) {}

  async create(data: CreateProjetoDto, files: Array<Express.Multer.File>) {
    let anexosData: any[] = [];
    if (files && files.length > 0) {
      anexosData = await Promise.all(
        files.map(async (file) => {
          const publicUrl = await this.storageService.uploadFile(file.buffer, file.originalname);
          return {
            nomeOriginal: file.originalname,
            nomeArquivo: file.originalname,
            caminho: publicUrl,
            mimetype: file.mimetype,
            tamanho: file.size,
          };
        }),
      );
    }

    const projeto = await this.prisma.projeto.create({
      data: {
        nomeEmpresa: data.nome,
        tipoProjeto: data.tipoProjeto,
        descricao: data.descricao || '',
        emails: data.emails || [],
        telefones: data.telefones || [],
        anexos: anexosData.length > 0 ? anexosData : undefined,
      },
    });

    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const linkProjeto = `${baseUrl}/admin/projetos`;

    if (projeto.telefones?.length > 0) {
      projeto.telefones.forEach((tel: string) => {
        const msg = `Olá! Recebemos o projeto #${projeto.id} (${projeto.tipoProjeto}).`;
        this.whatsappService.enviarMensagem(tel, msg).catch(() => {});
      });
    }

    if (projeto.emails?.length > 0) {
      projeto.emails.forEach((email: string) => {
        this.mailService
          .enviarNotificacaoGenerica(
            email,
            `Projeto #${projeto.id} Recebido`,
            `Recebemos seu projeto de ${projeto.tipoProjeto} com sucesso.`,
            linkProjeto,
          )
          .catch(() => {});
      });
    }

    return projeto;
  }

  async updateStatus(id: number, dto: UpdateProjetoStatusDto) {
    const projetoAtualizado = await this.prisma.projeto.update({
      where: { id },
      data: {
        ...(dto.status && { status: dto.status as any }),
        ...(dto.responsavel && { responsavel: dto.responsavel }),
        ...(dto.responsavelCor && { responsavelCor: dto.responsavelCor }),
      },
    });

    if (dto.status) {
      const etapa = STATUS_LABELS[dto.status] || dto.status;
      const msg = `Seu projeto #${projetoAtualizado.id} avançou para a etapa: ${etapa}.`;

      if (projetoAtualizado.telefones?.length > 0) {
        projetoAtualizado.telefones.forEach((tel: string) => {
          this.whatsappService.enviarMensagem(tel, msg).catch(() => {});
        });
      }

      if (projetoAtualizado.emails?.length > 0) {
        projetoAtualizado.emails.forEach((email: string) => {
          this.mailService
            .enviarNotificacaoGenerica(
              email,
              `Atualização do Projeto #${projetoAtualizado.id}`,
              msg,
            )
            .catch(() => {});
        });
      }
    }

    return projetoAtualizado;
  }

  async findAll() {
    return this.prisma.projeto.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number) {
    return this.prisma.projeto.findUnique({ where: { id } });
  }

  async remove(id: number) {
    return this.prisma.projeto.delete({ where: { id } });
  }
}
