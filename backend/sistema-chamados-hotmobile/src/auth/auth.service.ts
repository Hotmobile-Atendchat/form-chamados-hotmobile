import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomBytes } from 'crypto';
import * as bcrypt from 'bcrypt';
import { MailService } from 'src/Ticket/services/mail.service';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private readonly mailService: MailService,
  ) {}

  async login(email: string, pass: string) {
    const user = await this.prisma.usuario.findUnique({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('Credenciais invalidas');
    }

    const isMatch = await bcrypt.compare(pass, user.senha);
    if (!isMatch) {
      throw new UnauthorizedException('Credenciais invalidas');
    }

    if (!user.emailVerificado) {
      throw new ForbiddenException({
        code: 'ACCOUNT_NOT_VERIFIED',
        message: 'Sua conta ainda nao foi verificada por email.',
      });
    }

    const payload = { sub: user.id, email: user.email, nome: user.nome };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        cor: user.cor,
      },
    };
  }

  async register(data: { email: string; senha: string; nome: string; cor?: string }) {
    const email = data.email.trim().toLowerCase();
    const usuarioExistente = await this.prisma.usuario.findUnique({ where: { email } });

    const tokenVerificacao = this.criarTokenVerificacao();
    const tokenVerificacaoExpiraEm = this.criarExpiracaoToken();

    if (usuarioExistente) {
      if (usuarioExistente.emailVerificado) {
        throw new ConflictException('Este email ja esta cadastrado e verificado.');
      }

      const usuarioAtualizado = await this.prisma.usuario.update({
        where: { id: usuarioExistente.id },
        data: {
          nome: data.nome,
          cor: data.cor || usuarioExistente.cor || '#1976d2',
          senha: await bcrypt.hash(data.senha, 10),
          tokenVerificacao,
          tokenVerificacaoExpiraEm,
          emailVerificado: false,
        },
      });

      await this.enviarEmailVerificacao(usuarioAtualizado.email, usuarioAtualizado.nome, tokenVerificacao);

      return {
        success: true,
        message: 'Conta ja existente e pendente de validacao. Enviamos um novo email de verificacao.',
      };
    }

    const hashedPassword = await bcrypt.hash(data.senha, 10);

    const novoUsuario = await this.prisma.usuario.create({
      data: {
        email,
        nome: data.nome,
        cor: data.cor || '#1976d2',
        senha: hashedPassword,
        emailVerificado: false,
        tokenVerificacao,
        tokenVerificacaoExpiraEm,
      },
    });

    await this.enviarEmailVerificacao(novoUsuario.email, novoUsuario.nome, tokenVerificacao);

    return {
      success: true,
      message: 'Cadastro realizado. Verifique seu email para ativar a conta.',
    };
  }

  async verifyAccount(token: string) {
    if (!token) {
      throw new BadRequestException('Token de verificacao nao informado.');
    }

    const user = await this.prisma.usuario.findUnique({
      where: { tokenVerificacao: token },
    });

    if (!user) {
      throw new BadRequestException('Token de verificacao invalido.');
    }

    if (!user.tokenVerificacaoExpiraEm || user.tokenVerificacaoExpiraEm < new Date()) {
      throw new BadRequestException('Token de verificacao expirado. Solicite um novo email.');
    }

    await this.prisma.usuario.update({
      where: { id: user.id },
      data: {
        emailVerificado: true,
        tokenVerificacao: null,
        tokenVerificacaoExpiraEm: null,
      },
    });

    return { success: true, message: 'Conta verificada com sucesso. Agora voce ja pode fazer login.' };
  }

  async resendVerification(email: string) {
    if (!email) {
      throw new BadRequestException('Email nao informado.');
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await this.prisma.usuario.findUnique({ where: { email: normalizedEmail } });

    if (!user) {
      return {
        success: true,
        message: 'Se existir uma conta para este email, um novo link foi enviado.',
      };
    }

    if (user.emailVerificado) {
      return { success: true, message: 'Esta conta ja foi verificada.' };
    }

    const tokenVerificacao = this.criarTokenVerificacao();
    const tokenVerificacaoExpiraEm = this.criarExpiracaoToken();

    const updated = await this.prisma.usuario.update({
      where: { id: user.id },
      data: {
        tokenVerificacao,
        tokenVerificacaoExpiraEm,
      },
    });

    await this.enviarEmailVerificacao(updated.email, updated.nome, tokenVerificacao);

    return { success: true, message: 'Novo email de verificacao enviado com sucesso.' };
  }

  async updateProfile(userId: number, data: { nome?: string; email?: string; senha?: string; cor?: string }) {
    const dadosParaAtualizar: any = {};

    if (data.nome) dadosParaAtualizar.nome = data.nome;
    if (data.email) dadosParaAtualizar.email = data.email;
    if (data.cor) dadosParaAtualizar.cor = data.cor;

    if (data.senha && data.senha.trim() !== '') {
      dadosParaAtualizar.senha = await bcrypt.hash(data.senha, 10);
    }

    const userAtualizado = await this.prisma.usuario.update({
      where: { id: userId },
      data: dadosParaAtualizar,
    });

    return {
      id: userAtualizado.id,
      nome: userAtualizado.nome,
      email: userAtualizado.email,
      cor: userAtualizado.cor,
    };
  }

  async findAllForDropdown() {
    return this.prisma.usuario.findMany({
      where: { emailVerificado: true },
      select: {
        id: true,
        nome: true,
        email: true,
        cor: true,
      },
      orderBy: {
        nome: 'asc',
      },
    });
  }

  private criarTokenVerificacao() {
    return randomBytes(32).toString('hex');
  }

  private criarExpiracaoToken() {
    const expiracao = new Date();
    expiracao.setHours(expiracao.getHours() + 24);
    return expiracao;
  }

  private async enviarEmailVerificacao(email: string, nome: string, tokenVerificacao: string) {
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const linkVerificacao = `${baseUrl}/verify-account?token=${tokenVerificacao}`;

    await this.mailService.enviarVerificacaoConta(email, nome, linkVerificacao);
  }
}
