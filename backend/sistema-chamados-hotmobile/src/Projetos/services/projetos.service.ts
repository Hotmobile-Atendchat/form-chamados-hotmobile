import { Inject, Injectable } from '@nestjs/common';
import { endOfDay, parseISO, startOfDay } from 'date-fns';
import { PrismaService } from 'src/prisma.service';
import { MailService } from 'src/Ticket/services/mail.service';
import * as storageInterface from 'src/Ticket/services/storage.interface';
import { WhatsappService } from 'src/Ticket/services/whatsapp.service';
import { CreateProjetoDto } from '../dtos/create-projeto.dto';
import { CreateProjetoSprintDto } from '../dtos/create-projeto-sprint.dto';
import { CreateProjetoTarefaDto } from '../dtos/create-projeto-tarefa.dto';
import { UpdateProjetoSprintDto } from '../dtos/update-projeto-sprint.dto';
import { UpdateProjetoStatusDto } from '../dtos/update-projeto-status.dto';
import { UpdateProjetoTarefaDto } from '../dtos/update-projeto-tarefa.dto';
import { ProjetosGateway } from './projetos.gateway';

const STATUS_LABELS: Record<string, string> = {
  NOVO: 'Novo',
  PLANEJAMENTO: 'Planejamento',
  EM_EXECUCAO: 'Em Execucao',
  VALIDACAO: 'Validacao',
  FINALIZADO: 'Finalizado',
};

const STATUS_SPRINT_LABELS: Record<string, string> = {
  PLANEJADA: 'Planejada',
  ATIVA: 'Ativa',
  CONCLUIDA: 'Concluida',
};

const STATUS_TAREFA_LABELS: Record<string, string> = {
  PENDENTE: 'Pendente',
  EM_ANDAMENTO: 'Em andamento',
  CONCLUIDA: 'Concluida',
};

@Injectable()
export class ProjetosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
    private readonly whatsappService: WhatsappService,
    private readonly gateway: ProjetosGateway,
    @Inject('STORAGE_SERVICE') private readonly storageService: storageInterface.IStorageService,
  ) {}

  private projetoInclude = {
    sprints: { orderBy: { dataInicio: 'asc' as const } },
    tarefas: { include: { sprintRef: true }, orderBy: { createdAt: 'desc' as const } },
  };

  private formatDate(date: Date | string | null | undefined) {
    if (!date) return '-';
    const d = new Date(date);
    if (Number.isNaN(d.getTime())) return '-';
    return d.toLocaleDateString('pt-BR');
  }

  private buildPrazoProjetoResumo(sprints: Array<{ nome: string; status: string; dataInicio: Date; dataFim: Date }>) {
    if (!sprints?.length) {
      return 'Prazo: projeto ainda sem sprint definida.';
    }

    const sprintAtiva = sprints.find((s) => s.status === 'ATIVA');
    if (sprintAtiva) {
      return `Prazo da sprint ativa "${sprintAtiva.nome}": ${this.formatDate(sprintAtiva.dataInicio)} ate ${this.formatDate(sprintAtiva.dataFim)}.`;
    }

    const proximaSprint = sprints.find((s) => s.status !== 'CONCLUIDA');
    if (proximaSprint) {
      return `Proximo prazo da sprint "${proximaSprint.nome}": ${this.formatDate(proximaSprint.dataInicio)} ate ${this.formatDate(proximaSprint.dataFim)}.`;
    }

    const ultimaSprint = sprints[sprints.length - 1];
    return `Ultimo prazo registrado: sprint "${ultimaSprint.nome}" (${this.formatDate(ultimaSprint.dataInicio)} ate ${this.formatDate(ultimaSprint.dataFim)}).`;
  }

  private async notifyProjetoContatos(
    projeto: {
      id: number;
      emails?: string[] | null;
      telefones?: string[] | null;
    },
    assuntoEmail: string,
    mensagem: string,
    linkAcao?: string,
  ) {
    const envios: Promise<unknown>[] = [];
    const mensagemWhatsapp = `${mensagem}\n\nEquipe Hotmobile`;

    if (projeto.telefones?.length) {
      projeto.telefones.forEach((tel) => {
        envios.push(this.whatsappService.enviarMensagem(tel, mensagemWhatsapp).catch(() => null));
      });
    }

    if (projeto.emails?.length) {
      projeto.emails.forEach((email) => {
        envios.push(
          this.mailService.enviarNotificacaoGenerica(email, assuntoEmail, mensagem, linkAcao).catch(() => null),
        );
      });
    }

    if (envios.length > 0) {
      await Promise.allSettled(envios);
    }
  }

  private getProjetoLink() {
    return `${process.env.FRONTEND_URL || 'http://localhost:5173'}/admin/projetos`;
  }

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
      include: this.projetoInclude,
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

    this.gateway.emitirNovoProjeto(projeto);
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
      include: this.projetoInclude,
    });

    if (dto.status) {
      const etapa = STATUS_LABELS[dto.status] || dto.status;
      const prazoResumo = this.buildPrazoProjetoResumo(projetoAtualizado.sprints || []);
      const msg = `Transparencia de andamento: o projeto #${projetoAtualizado.id} avancou para a etapa "${etapa}". ${prazoResumo}`;

      await this.notifyProjetoContatos(
        projetoAtualizado,
        `Projeto #${projetoAtualizado.id}: etapa atualizada`,
        msg,
        this.getProjetoLink(),
      );
    }

    if (dto.status) {
      this.gateway.emitirMudancaStatusProjeto(id, dto.status);
    }

    return projetoAtualizado;
  }

  async createTask(projetoId: number, dto: CreateProjetoTarefaDto, userId?: number) {
    const projeto = await this.prisma.projeto.findUniqueOrThrow({
      where: { id: projetoId },
      select: {
        id: true,
        nomeProjeto: true,
        emails: true,
        telefones: true,
      },
    });

    if (dto.sprintId) {
      await this.prisma.projetoSprint.findFirstOrThrow({
        where: { id: dto.sprintId, projetoId },
      });
    }

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
        sprintId: dto.sprintId,
        autor: autorUser?.nome || 'Usuario',
        responsavel: dto.responsavel,
        responsavelCor: dto.responsavelCor,
      },
      include: { sprintRef: true },
    });

    const prazoTarefa = tarefa.sprintRef
      ? `Prazo da sprint "${tarefa.sprintRef.nome}": ${this.formatDate(tarefa.sprintRef.dataInicio)} ate ${this.formatDate(tarefa.sprintRef.dataFim)}.`
      : 'Prazo: tarefa ainda sem sprint vinculada.';

    const msg = `Nova tarefa registrada no projeto #${projeto.id} (${projeto.nomeProjeto}): "${tarefa.titulo}". ${prazoTarefa} Seguimos atualizando cada movimentacao para manter total transparencia.`;
    await this.notifyProjetoContatos(
      projeto,
      `Projeto #${projeto.id}: nova tarefa criada`,
      msg,
      this.getProjetoLink(),
    );

    return tarefa;
  }

  async updateTask(projetoId: number, taskId: number, dto: UpdateProjetoTarefaDto) {
    const tarefaAnterior = await this.prisma.projetoTarefa.findFirstOrThrow({
      where: { id: taskId, projetoId },
      select: { id: true, status: true, titulo: true },
    });

    if (dto.sprintId && dto.sprintId > 0) {
      await this.prisma.projetoSprint.findFirstOrThrow({
        where: { id: dto.sprintId, projetoId },
      });
    }

    const tarefaAtualizada = await this.prisma.projetoTarefa.update({
      where: { id: tarefaAnterior.id },
      data: {
        ...(dto.titulo !== undefined && { titulo: dto.titulo }),
        ...(dto.descricao !== undefined && { descricao: dto.descricao }),
        ...(dto.sprintId !== undefined && { sprintId: dto.sprintId > 0 ? dto.sprintId : null }),
        ...(dto.status !== undefined && { status: dto.status as any }),
        ...(dto.responsavel !== undefined && { responsavel: dto.responsavel }),
        ...(dto.responsavelCor !== undefined && { responsavelCor: dto.responsavelCor }),
      },
      include: { sprintRef: true },
    });

    const finalizouAgora =
      dto.status === 'CONCLUIDA' &&
      tarefaAnterior.status !== 'CONCLUIDA' &&
      tarefaAtualizada.status === 'CONCLUIDA';

    if (finalizouAgora) {
      const projeto = await this.prisma.projeto.findUniqueOrThrow({
        where: { id: projetoId },
        select: {
          id: true,
          nomeProjeto: true,
          emails: true,
          telefones: true,
        },
      });

      const prazoTarefa = tarefaAtualizada.sprintRef
        ? `Prazo da sprint: ${this.formatDate(tarefaAtualizada.sprintRef.dataInicio)} ate ${this.formatDate(tarefaAtualizada.sprintRef.dataFim)}.`
        : 'Prazo: tarefa sem sprint vinculada.';

      const statusLabel = STATUS_TAREFA_LABELS[tarefaAtualizada.status] || tarefaAtualizada.status;
      const msg = `Tarefa concluida no projeto #${projeto.id} (${projeto.nomeProjeto}): "${tarefaAtualizada.titulo}". Status atual: ${statusLabel}. ${prazoTarefa}`;

      await this.notifyProjetoContatos(
        projeto,
        `Projeto #${projeto.id}: tarefa finalizada`,
        msg,
        this.getProjetoLink(),
      );
    }

    return tarefaAtualizada;
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

  async createSprint(projetoId: number, dto: CreateProjetoSprintDto) {
    const projeto = await this.prisma.projeto.findUniqueOrThrow({
      where: { id: projetoId },
      select: {
        id: true,
        nomeProjeto: true,
        emails: true,
        telefones: true,
      },
    });

    const sprint = await this.prisma.projetoSprint.create({
      data: {
        projetoId,
        nome: dto.nome,
        dataInicio: new Date(dto.dataInicio),
        dataFim: new Date(dto.dataFim),
      },
    });

    const statusLabel = STATUS_SPRINT_LABELS[sprint.status] || sprint.status;
    const msg = `Nova sprint criada no projeto #${projeto.id} (${projeto.nomeProjeto}): "${sprint.nome}". Status atual: ${statusLabel}. Prazo planejado: ${this.formatDate(sprint.dataInicio)} ate ${this.formatDate(sprint.dataFim)}.`;

    await this.notifyProjetoContatos(
      projeto,
      `Projeto #${projeto.id}: sprint criada`,
      msg,
      this.getProjetoLink(),
    );

    return sprint;
  }

  async updateSprint(projetoId: number, sprintId: number, dto: UpdateProjetoSprintDto) {
    const sprintAnterior = await this.prisma.projetoSprint.findFirstOrThrow({
      where: { id: sprintId, projetoId },
      select: { id: true, status: true, nome: true },
    });

    const sprintAtualizada = await this.prisma.projetoSprint.update({
      where: { id: sprintAnterior.id },
      data: {
        ...(dto.nome !== undefined && { nome: dto.nome }),
        ...(dto.dataInicio !== undefined && { dataInicio: new Date(dto.dataInicio) }),
        ...(dto.dataFim !== undefined && { dataFim: new Date(dto.dataFim) }),
        ...(dto.status !== undefined && { status: dto.status as any }),
      },
    });

    const finalizouAgora =
      dto.status === 'CONCLUIDA' &&
      sprintAnterior.status !== 'CONCLUIDA' &&
      sprintAtualizada.status === 'CONCLUIDA';

    if (finalizouAgora) {
      const projeto = await this.prisma.projeto.findUniqueOrThrow({
        where: { id: projetoId },
        select: {
          id: true,
          nomeProjeto: true,
          emails: true,
          telefones: true,
        },
      });

      const statusLabel = STATUS_SPRINT_LABELS[sprintAtualizada.status] || sprintAtualizada.status;
      const msg = `Sprint concluida no projeto #${projeto.id} (${projeto.nomeProjeto}): "${sprintAtualizada.nome}". Status atual: ${statusLabel}. Janela planejada: ${this.formatDate(sprintAtualizada.dataInicio)} ate ${this.formatDate(sprintAtualizada.dataFim)}.`;

      await this.notifyProjetoContatos(
        projeto,
        `Projeto #${projeto.id}: sprint finalizada`,
        msg,
        this.getProjetoLink(),
      );
    }

    return sprintAtualizada;
  }

  async deleteSprint(projetoId: number, sprintId: number) {
    const sprint = await this.prisma.projetoSprint.findFirstOrThrow({
      where: { id: sprintId, projetoId },
      select: { id: true },
    });

    return this.prisma.projetoSprint.delete({
      where: { id: sprint.id },
    });
  }

  async findAll() {
    return this.prisma.projeto.findMany({
      include: this.projetoInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number) {
    return this.prisma.projeto.findUnique({
      where: { id },
      include: this.projetoInclude,
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
