import { Inject, Injectable } from '@nestjs/common';
import { endOfDay, parseISO, startOfDay } from 'date-fns';
import { PrismaService } from 'src/prisma.service';
import { MailService } from 'src/Ticket/services/mail.service';
import * as storageInterface from 'src/Ticket/services/storage.interface';
import { WhatsappService } from 'src/Ticket/services/whatsapp.service';
import { CreateProjetoDto } from '../dtos/create-projeto.dto';
import { CreateProjetoTarefaDto } from '../dtos/create-projeto-tarefa.dto';
import { UpdateProjetoStatusDto } from '../dtos/update-projeto-status.dto';
import { UpdateProjetoTarefaDto } from '../dtos/update-projeto-tarefa.dto';

const STATUS_LABELS: Record<string, string> = {
  NOVO: 'Novo',
  PLANEJAMENTO: 'Planejamento',
  EM_EXECUCAO: 'Em Execucao',
  VALIDACAO: 'Validacao',
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
        nomeProjeto: data.nomeProjeto,
        tipoProjeto: data.tipoProjeto,
        descricao: data.descricao || '',
        emails: data.emails || [],
        telefones: data.telefones || [],
        anexos: anexosData.length > 0 ? anexosData : undefined,
      },
      include: { tarefas: { orderBy: { createdAt: 'desc' } } },
    });

    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const linkProjeto = `${baseUrl}/admin/projetos`;

    if (projeto.telefones?.length > 0) {
      projeto.telefones.forEach((tel: string) => {
        const msg = `Ola! Recebemos o projeto #${projeto.id} (${projeto.nomeProjeto}).`;
        this.whatsappService.enviarMensagem(tel, msg).catch(() => {});
      });
    }

    if (projeto.emails?.length > 0) {
      projeto.emails.forEach((email: string) => {
        this.mailService
          .enviarNotificacaoGenerica(
            email,
            `Projeto #${projeto.id} Recebido`,
            `Recebemos seu projeto "${projeto.nomeProjeto}" com sucesso.`,
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
      include: { tarefas: { orderBy: { createdAt: 'desc' } } },
    });

    if (dto.status) {
      const etapa = STATUS_LABELS[dto.status] || dto.status;
      const msg = `Seu projeto #${projetoAtualizado.id} avancou para a etapa: ${etapa}.`;

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
              `Atualizacao do Projeto #${projetoAtualizado.id}`,
              msg,
            )
            .catch(() => {});
        });
      }
    }

    return projetoAtualizado;
  }

  async createTask(projetoId: number, dto: CreateProjetoTarefaDto, userId?: number) {
    await this.prisma.projeto.findUniqueOrThrow({ where: { id: projetoId } });

    const autorUser = userId
      ? await this.prisma.usuario.findUnique({
          where: { id: userId },
          select: { nome: true },
        })
      : null;

    const tarefa = await this.prisma.projetoTarefa.create({
      data: {
        projetoId,
        titulo: dto.titulo,
        descricao: dto.descricao,
        sprint: dto.sprint,
        autor: autorUser?.nome || 'Usuario',
        responsavel: dto.responsavel,
        responsavelCor: dto.responsavelCor,
      },
    });

    return tarefa;
  }

  async updateTask(projetoId: number, taskId: number, dto: UpdateProjetoTarefaDto) {
    const tarefa = await this.prisma.projetoTarefa.findFirstOrThrow({
      where: { id: taskId, projetoId },
      select: { id: true },
    });

    return this.prisma.projetoTarefa.update({
      where: { id: tarefa.id },
      data: {
        ...(dto.titulo !== undefined && { titulo: dto.titulo }),
        ...(dto.descricao !== undefined && { descricao: dto.descricao }),
        ...(dto.sprint !== undefined && { sprint: dto.sprint }),
        ...(dto.status !== undefined && { status: dto.status as any }),
        ...(dto.responsavel !== undefined && { responsavel: dto.responsavel }),
        ...(dto.responsavelCor !== undefined && { responsavelCor: dto.responsavelCor }),
      },
    });
  }

  async deleteTask(projetoId: number, taskId: number) {
    const tarefa = await this.prisma.projetoTarefa.findFirstOrThrow({
      where: { id: taskId, projetoId },
      select: { id: true },
    });

    return this.prisma.projetoTarefa.delete({
      where: { id: tarefa.id },
    });
  }

  async findAll() {
    return this.prisma.projeto.findMany({
      include: { tarefas: { orderBy: { createdAt: 'desc' } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number) {
    return this.prisma.projeto.findUnique({
      where: { id },
      include: { tarefas: { orderBy: { createdAt: 'desc' } } },
    });
  }

  async remove(id: number) {
    return this.prisma.projeto.delete({ where: { id } });
  }

  async getDashboardMetrics(startStr?: string, endStr?: string) {
    const endDate = endStr ? endOfDay(parseISO(endStr)) : endOfDay(new Date());
    const startDate = startStr
      ? startOfDay(parseISO(startStr))
      : startOfDay(new Date(new Date().setDate(new Date().getDate() - 30)));

    const projetos = await this.prisma.projeto.findMany({
      where: {
        createdAt: { gte: startDate, lte: endDate },
      },
      include: { tarefas: true },
      orderBy: { createdAt: 'asc' },
    });

    const total = projetos.length;
    const finalizados = projetos.filter((p) => p.status === 'FINALIZADO').length;
    const emAndamento = total - finalizados;

    const statusCount: Record<string, number> = {};
    const tipoCount: Record<string, number> = {};
    const timelineCount: Record<string, number> = {};

    let totalTarefas = 0;
    let tarefasConcluidas = 0;

    projetos.forEach((projeto) => {
      statusCount[projeto.status] = (statusCount[projeto.status] || 0) + 1;
      tipoCount[projeto.tipoProjeto] = (tipoCount[projeto.tipoProjeto] || 0) + 1;

      const dateKey = new Date(projeto.createdAt).toISOString().split('T')[0];
      timelineCount[dateKey] = (timelineCount[dateKey] || 0) + 1;

      totalTarefas += projeto.tarefas?.length || 0;
      tarefasConcluidas += (projeto.tarefas || []).filter((t) => t.status === 'CONCLUIDA').length;
    });

    const statusData = Object.entries(statusCount).map(([name, value]) => ({ name, value }));
    const tipoData = Object.entries(tipoCount)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
    const timelineData = Object.entries(timelineCount).map(([name, projetosNoDia]) => ({
      name,
      projetos: projetosNoDia,
    }));

    return {
      kpis: {
        total,
        finalizados,
        emAndamento,
        totalTarefas,
        tarefasConcluidas,
      },
      statusData,
      tipoData,
      timelineData,
      rawDetails: projetos,
    };
  }
}
